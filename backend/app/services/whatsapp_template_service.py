import json

from app.exceptions import NotFoundException
from app.models.whatsapp_template import WhatsAppTemplate
from app.providers.whatsapp import WhatsAppError, WhatsAppProvider
from app.repositories.whatsapp_account_repository import WhatsAppAccountRepository
from app.repositories.whatsapp_template_repository import WhatsAppTemplateRepository
from app.schemas.whatsapp_template import (
    WhatsAppTemplateCreate,
    WhatsAppTemplateRead,
    WhatsAppTemplateUpdate,
)


class WhatsAppTemplateService:
    def __init__(
        self,
        template_repo: WhatsAppTemplateRepository,
        account_repo: WhatsAppAccountRepository,
    ):
        self.template_repo = template_repo
        self.account_repo = account_repo

    def _to_read(self, t: WhatsAppTemplate) -> WhatsAppTemplateRead:
        return WhatsAppTemplateRead(
            id=t.id,
            account_id=t.account_id,
            name=t.name,
            language=t.language,
            category=t.category,
            status=t.status,
            meta_template_id=t.meta_template_id,
            components=t.components,
            created_at=t.created_at,
            updated_at=t.updated_at,
        )

    def _get_provider(self, account_id: int) -> WhatsAppProvider:
        account = self.account_repo.get_by_id(account_id)
        if not account:
            raise NotFoundException("WhatsApp account not found")
        if not account.business_account_id:
            raise ValueError("WhatsApp account has no WABA ID (business_account_id)")
        return WhatsAppProvider(account)

    def list_templates(self, account_id: int) -> list[WhatsAppTemplateRead]:
        return [self._to_read(t) for t in self.template_repo.get_by_account(account_id)]

    def get_template(self, template_id: int) -> WhatsAppTemplateRead:
        t = self.template_repo.get_by_id(template_id)
        if not t:
            raise NotFoundException("Template not found")
        return self._to_read(t)

    def refresh_from_meta(self, account_id: int) -> list[WhatsAppTemplateRead]:
        provider = self._get_provider(account_id)
        meta_templates = provider.get_templates()

        existing = {t.name: t for t in self.template_repo.get_by_account(account_id)}
        meta_names = {mt.get("name") for mt in meta_templates}

        for mt in meta_templates:
            name = mt.get("name")
            if name in existing:
                t = existing[name]
                t.status = mt.get("status", t.status)
                t.category = mt.get("category", t.category)
                t.meta_template_id = mt.get("id")
                t.components = json.dumps(mt.get("components", []))
            else:
                t = WhatsAppTemplate(
                    account_id=account_id,
                    name=name,
                    language=mt.get("language", "en_US"),
                    category=mt.get("category", "MARKETING"),
                    status=mt.get("status", "PENDING"),
                    meta_template_id=mt.get("id"),
                    components=json.dumps(mt.get("components", [])),
                )
                self.template_repo.create(t)

        for name, t in existing.items():
            if name not in meta_names and t.status != "DELETED":
                t.status = "DELETED"

        return self.list_templates(account_id)

    def sync_orphans(self, account_id: int) -> list[WhatsAppTemplateRead]:
        provider = self._get_provider(account_id)
        meta_templates = provider.get_templates()
        meta_names = {mt.get("name") for mt in meta_templates}

        templates = self.template_repo.get_by_account(account_id)
        for t in templates:
            if t.name not in meta_names:
                self.template_repo.delete_by_id(t.id)

        return self.list_templates(account_id)

    def create_template(
        self, account_id: int, data: WhatsAppTemplateCreate
    ) -> WhatsAppTemplateRead:
        provider = self._get_provider(account_id)
        try:
            resp = provider.create_template(
                name=data.name,
                language=data.language,
                category=data.category,
                components=data.components,
                allow_category_change=data.allow_category_change,
            )
        except WhatsAppError as e:
            raise ValueError(f"Meta API error: {e.details or e.title}")

        t = WhatsAppTemplate(
            account_id=account_id,
            name=data.name,
            language=data.language,
            category=resp.get("category", data.category),
            status=resp.get("status", "PENDING"),
            meta_template_id=resp.get("id"),
            components=json.dumps(data.components),
        )
        t = self.template_repo.create(t)
        return self._to_read(t)

    def update_template(
        self, template_id: int, data: WhatsAppTemplateUpdate
    ) -> WhatsAppTemplateRead:
        t = self.template_repo.get_by_id(template_id)
        if not t:
            raise NotFoundException("Template not found")
        if not t.meta_template_id:
            raise ValueError("Template has no Meta ID, cannot update")

        provider = self._get_provider(t.account_id)
        try:
            provider.edit_template(
                template_id=t.meta_template_id,
                language=data.language,
                category=data.category,
                components=data.components,
                allow_category_change=data.allow_category_change,
            )
        except WhatsAppError as e:
            raise ValueError(f"Meta API error: {e.details or e.title}")

        t.language = data.language
        t.category = data.category
        t.components = json.dumps(data.components)
        t.status = "PENDING"
        t = self.template_repo.save(t)
        return self._to_read(t)

    def delete_template(self, template_id: int) -> None:
        t = self.template_repo.get_by_id(template_id)
        if not t:
            raise NotFoundException("Template not found")
        try:
            provider = self._get_provider(t.account_id)
            provider.delete_template_by_name(t.name)
        except Exception:
            pass
        self.template_repo.delete_by_id(template_id)

    def update_status(self, meta_template_id: str, status: str) -> None:
        t = self.template_repo.get_by_meta_id(meta_template_id)
        if t:
            t.status = status
            self.template_repo.save(t)
