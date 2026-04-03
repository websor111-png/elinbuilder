from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
import bcrypt
import jwt
import uuid
import json
import secrets
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from emergentintegrations.llm.chat import LlmChat, UserMessage

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_ALGORITHM = "HS256"

def get_jwt_secret():
    return os.environ["JWT_SECRET"]

# Password hashing
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

# JWT tokens
def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(hours=24), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

# Auth helper
async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        if user.get("blocked", False):
            raise HTTPException(status_code=403, detail="Account blocked")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# Create the app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ========== MODELS ==========
class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class AppCreateRequest(BaseModel):
    name: str
    url: str
    description: Optional[str] = ""

class AppUpdateRequest(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None
    package_name: Optional[str] = None
    app_icon_url: Optional[str] = None
    primary_color: Optional[str] = "#002FA7"
    splash_color: Optional[str] = "#FFFFFF"
    orientation: Optional[str] = "portrait"
    status_bar_color: Optional[str] = "#002FA7"
    enable_javascript: Optional[bool] = True
    enable_geolocation: Optional[bool] = False
    enable_camera: Optional[bool] = False
    enable_notifications: Optional[bool] = False
    google_play_title: Optional[str] = None
    google_play_description: Optional[str] = None
    google_play_category: Optional[str] = None
    google_play_service_account_key: Optional[str] = None

class ChatMessageRequest(BaseModel):
    app_id: str
    message: str

# ========== AUTH ENDPOINTS ==========
@api_router.post("/auth/register")
async def register(req: RegisterRequest, response: Response):
    email = req.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_doc = {
        "username": req.username.strip(),
        "email": email,
        "password_hash": hash_password(req.password),
        "role": "user",
        "blocked": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "apps_count": 0
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return {"id": user_id, "username": req.username, "email": email, "role": "user", "token": access_token}

@api_router.post("/auth/login")
async def login(req: LoginRequest, request: Request, response: Response):
    email = req.email.lower().strip()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    # Brute force check
    attempt = await db.login_attempts.find_one({"identifier": identifier}, {"_id": 0})
    if attempt and attempt.get("count", 0) >= 5:
        locked_until = attempt.get("locked_until")
        if locked_until and datetime.now(timezone.utc) < datetime.fromisoformat(locked_until):
            raise HTTPException(status_code=429, detail="Too many attempts. Try again later.")
        else:
            await db.login_attempts.delete_one({"identifier": identifier})

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(req.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"locked_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}},
            upsert=True
        )
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user.get("blocked", False):
        raise HTTPException(status_code=403, detail="Account blocked by administrator")
    
    await db.login_attempts.delete_one({"identifier": identifier})
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return {"id": user_id, "username": user.get("username", ""), "email": email, "role": user.get("role", "user"), "token": access_token}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

# ========== APP CRUD ==========
@api_router.post("/apps")
async def create_app(req: AppCreateRequest, request: Request):
    user = await get_current_user(request)
    app_doc = {
        "id": str(uuid.uuid4()),
        "name": req.name,
        "url": req.url,
        "description": req.description or "",
        "user_id": str(user["_id"]),
        "package_name": f"com.elynbuilder.{req.name.lower().replace(' ', '')}",
        "app_icon_url": "",
        "primary_color": "#002FA7",
        "splash_color": "#FFFFFF",
        "orientation": "portrait",
        "status_bar_color": "#002FA7",
        "enable_javascript": True,
        "enable_geolocation": False,
        "enable_camera": False,
        "enable_notifications": False,
        "google_play_title": "",
        "google_play_description": "",
        "google_play_category": "",
        "google_play_service_account_key": "",
        "status": "draft",
        "platform": "both",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.apps.insert_one(app_doc)
    await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$inc": {"apps_count": 1}})
    app_doc.pop("_id", None)
    return app_doc

@api_router.get("/apps")
async def get_apps(request: Request):
    user = await get_current_user(request)
    apps = await db.apps.find({"user_id": str(user["_id"])}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return apps

@api_router.get("/apps/{app_id}")
async def get_app(app_id: str, request: Request):
    user = await get_current_user(request)
    app_doc = await db.apps.find_one({"id": app_id, "user_id": str(user["_id"])}, {"_id": 0})
    if not app_doc:
        raise HTTPException(status_code=404, detail="App not found")
    return app_doc

@api_router.put("/apps/{app_id}")
async def update_app(app_id: str, req: AppUpdateRequest, request: Request):
    user = await get_current_user(request)
    update_data = {k: v for k, v in req.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.apps.update_one(
        {"id": app_id, "user_id": str(user["_id"])},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="App not found")
    updated = await db.apps.find_one({"id": app_id}, {"_id": 0})
    return updated

@api_router.delete("/apps/{app_id}")
async def delete_app(app_id: str, request: Request):
    user = await get_current_user(request)
    result = await db.apps.delete_one({"id": app_id, "user_id": str(user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="App not found")
    await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$inc": {"apps_count": -1}})
    return {"message": "App deleted"}

# ========== AI CHAT ==========
@api_router.post("/ai/chat")
async def ai_chat(req: ChatMessageRequest, request: Request):
    user = await get_current_user(request)
    app_doc = await db.apps.find_one({"id": req.app_id, "user_id": str(user["_id"])}, {"_id": 0})
    if not app_doc:
        raise HTTPException(status_code=404, detail="App not found")
    
    api_key = os.environ.get("EMERGENT_LLM_KEY", "")
    session_id = f"app-{req.app_id}-{user['_id']}"
    
    system_msg = f"""You are Elyn AI, a professional mobile app builder assistant. You help users configure and optimize their WebView mobile applications.

Current app details:
- Name: {app_doc.get('name', '')}
- URL: {app_doc.get('url', '')}
- Package: {app_doc.get('package_name', '')}
- Platform: {app_doc.get('platform', 'both')}

You can help with:
1. Optimizing app configuration (colors, icons, permissions)
2. Suggesting improvements for the mobile experience
3. Generating app descriptions for Google Play/App Store
4. Recommending package names and branding
5. Troubleshooting WebView issues

Respond in the user's language. Be concise and professional."""

    # Save user message
    user_msg_doc = {
        "id": str(uuid.uuid4()),
        "app_id": req.app_id,
        "user_id": str(user["_id"]),
        "role": "user",
        "content": req.message,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.chat_messages.insert_one(user_msg_doc)

    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message=system_msg
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")

        user_message = UserMessage(text=req.message)
        ai_response = await chat.send_message(user_message)

        # Save AI response
        ai_msg_doc = {
            "id": str(uuid.uuid4()),
            "app_id": req.app_id,
            "user_id": str(user["_id"]),
            "role": "assistant",
            "content": ai_response,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.chat_messages.insert_one(ai_msg_doc)
        ai_msg_doc.pop("_id", None)
        return {"response": ai_response, "message_id": ai_msg_doc["id"]}
    except Exception as e:
        logger.error(f"AI chat error: {e}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@api_router.get("/ai/chat/{app_id}")
async def get_chat_history(app_id: str, request: Request):
    user = await get_current_user(request)
    messages = await db.chat_messages.find(
        {"app_id": app_id, "user_id": str(user["_id"])},
        {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    return messages

# ========== APP GENERATION ==========
@api_router.post("/apps/{app_id}/generate")
async def generate_app(app_id: str, request: Request):
    user = await get_current_user(request)
    app_doc = await db.apps.find_one({"id": app_id, "user_id": str(user["_id"])}, {"_id": 0})
    if not app_doc:
        raise HTTPException(status_code=404, detail="App not found")
    
    # Generate Android project config
    android_config = {
        "project_type": "android_webview",
        "app_name": app_doc["name"],
        "package_name": app_doc.get("package_name", "com.elynbuilder.app"),
        "url": app_doc["url"],
        "primary_color": app_doc.get("primary_color", "#002FA7"),
        "splash_color": app_doc.get("splash_color", "#FFFFFF"),
        "status_bar_color": app_doc.get("status_bar_color", "#002FA7"),
        "orientation": app_doc.get("orientation", "portrait"),
        "permissions": {
            "internet": True,
            "geolocation": app_doc.get("enable_geolocation", False),
            "camera": app_doc.get("enable_camera", False),
            "notifications": app_doc.get("enable_notifications", False)
        },
        "webview_settings": {
            "javascript_enabled": app_doc.get("enable_javascript", True),
            "dom_storage": True,
            "file_access": True
        }
    }

    # Generate iOS project config
    ios_config = {
        "project_type": "ios_webview",
        "app_name": app_doc["name"],
        "bundle_id": app_doc.get("package_name", "com.elynbuilder.app"),
        "url": app_doc["url"],
        "primary_color": app_doc.get("primary_color", "#002FA7"),
        "orientation": app_doc.get("orientation", "portrait"),
        "permissions": {
            "geolocation": app_doc.get("enable_geolocation", False),
            "camera": app_doc.get("enable_camera", False),
            "notifications": app_doc.get("enable_notifications", False)
        }
    }

    # Generate MainActivity.kt
    main_activity = f'''package {app_doc.get("package_name", "com.elynbuilder.app")}

import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebChromeClient
import android.webkit.GeolocationPermissions
import androidx.appcompat.app.AppCompatActivity
import android.view.View

class MainActivity : AppCompatActivity() {{
    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {{
        super.onCreate(savedInstanceState)
        
        window.statusBarColor = android.graphics.Color.parseColor("{app_doc.get("status_bar_color", "#002FA7")}")
        
        webView = WebView(this)
        setContentView(webView)
        
        webView.settings.apply {{
            javaScriptEnabled = {str(app_doc.get("enable_javascript", True)).lower()}
            domStorageEnabled = true
            allowFileAccess = true
            loadWithOverviewMode = true
            useWideViewPort = true
        }}
        
        webView.webViewClient = WebViewClient()
        webView.webChromeClient = object : WebChromeClient() {{
            override fun onGeolocationPermissionsShowPrompt(
                origin: String?,
                callback: GeolocationPermissions.Callback?
            ) {{
                callback?.invoke(origin, true, false)
            }}
        }}
        
        webView.loadUrl("{app_doc["url"]}")
    }}

    override fun onBackPressed() {{
        if (webView.canGoBack()) {{
            webView.goBack()
        }} else {{
            super.onBackPressed()
        }}
    }}
}}'''

    # Generate build.gradle
    build_gradle = f'''plugins {{
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
}}

android {{
    namespace '{app_doc.get("package_name", "com.elynbuilder.app")}'
    compileSdk 34

    defaultConfig {{
        applicationId "{app_doc.get("package_name", "com.elynbuilder.app")}"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0"
    }}

    buildTypes {{
        release {{
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }}
    }}
}}

dependencies {{
    implementation 'androidx.core:core-ktx:1.12.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'androidx.webkit:webkit:1.10.0'
}}'''

    # iOS Swift ViewController
    ios_viewcontroller = f'''import UIKit
import WebKit

class ViewController: UIViewController, WKNavigationDelegate {{
    var webView: WKWebView!
    
    override func loadView() {{
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        view = webView
    }}
    
    override func viewDidLoad() {{
        super.viewDidLoad()
        let url = URL(string: "{app_doc["url"]}")!
        webView.load(URLRequest(url: url))
    }}
}}'''

    generation_result = {
        "app_id": app_id,
        "android": {
            "config": android_config,
            "main_activity": main_activity,
            "build_gradle": build_gradle
        },
        "ios": {
            "config": ios_config,
            "view_controller": ios_viewcontroller
        },
        "generated_at": datetime.now(timezone.utc).isoformat()
    }

    await db.apps.update_one(
        {"id": app_id},
        {"$set": {"status": "generated", "generation_result": generation_result, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )

    return generation_result

# ========== ADMIN ENDPOINTS ==========
@api_router.get("/admin/users")
async def admin_get_users(request: Request):
    await require_admin(request)
    users = await db.users.find({}, {"password_hash": 0}).to_list(1000)
    for u in users:
        u["_id"] = str(u["_id"])
    return users

@api_router.put("/admin/users/{user_id}/block")
async def admin_block_user(user_id: str, request: Request):
    await require_admin(request)
    result = await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"blocked": True}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User blocked"}

@api_router.put("/admin/users/{user_id}/unblock")
async def admin_unblock_user(user_id: str, request: Request):
    await require_admin(request)
    result = await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"blocked": False}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User unblocked"}

@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, request: Request):
    admin = await require_admin(request)
    if user_id == str(admin["_id"]):
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    await db.apps.delete_many({"user_id": user_id})
    await db.chat_messages.delete_many({"user_id": user_id})
    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}

@api_router.get("/admin/apps")
async def admin_get_all_apps(request: Request):
    await require_admin(request)
    apps = await db.apps.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return apps

@api_router.get("/admin/stats")
async def admin_get_stats(request: Request):
    await require_admin(request)
    total_users = await db.users.count_documents({})
    total_apps = await db.apps.count_documents({})
    blocked_users = await db.users.count_documents({"blocked": True})
    generated_apps = await db.apps.count_documents({"status": "generated"})
    recent_users = await db.users.find({}, {"password_hash": 0}).sort("created_at", -1).limit(5).to_list(5)
    for u in recent_users:
        u["_id"] = str(u["_id"])
    return {
        "total_users": total_users,
        "total_apps": total_apps,
        "blocked_users": blocked_users,
        "generated_apps": generated_apps,
        "recent_users": recent_users
    }

# ========== HEALTH ==========
@api_router.get("/")
async def root():
    return {"message": "Elyn Builder App iOS API", "version": "1.0.0"}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Startup
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.apps.create_index("user_id")
    await db.apps.create_index("id", unique=True)
    await db.chat_messages.create_index([("app_id", 1), ("user_id", 1)])
    
    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@elynbuilder.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "ElynAdmin2024!")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "username": "Admin",
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "role": "admin",
            "blocked": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "apps_count": 0
        })
        logger.info(f"Admin seeded: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Admin password updated")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
