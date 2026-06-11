from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.contacts import router as contacts_router
from app.api.conversations import router as conversations_router
from app.api.import_export import router as import_export_router
from app.api.permissions import router as permissions_router
from app.api.roles import router as roles_router
from app.api.users import router as users_router
from app.api.whatsapp_accounts import router as whatsapp_accounts_router
from app.api.whatsapp_templates import router as whatsapp_templates_router
from app.api.whatsapp_webhook import router as whatsapp_webhook_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(roles_router, prefix="/roles", tags=["roles"])
api_router.include_router(
    permissions_router, prefix="/permissions", tags=["permissions"]
)
api_router.include_router(contacts_router, prefix="/contacts", tags=["contacts"])
api_router.include_router(
    conversations_router, prefix="/conversations", tags=["conversations"]
)
api_router.include_router(import_export_router, prefix="", tags=["import-export"])
api_router.include_router(
    whatsapp_accounts_router, prefix="/whatsapp-accounts", tags=["whatsapp-accounts"]
)
api_router.include_router(
    whatsapp_webhook_router, prefix="/whatsapp", tags=["whatsapp"]
)
api_router.include_router(
    whatsapp_templates_router,
    prefix="/whatsapp-templates",
    tags=["whatsapp-templates"],
)
