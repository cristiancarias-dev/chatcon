from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from app.auth import require_permission
from app.database import get_db
from app.models.user import User
from app.services.import_export_service import HANDLERS, parse_csv

router = APIRouter()


@router.get("/tools/{model}/template")
def download_template(
    model: str,
    _: User = Depends(require_permission("read_user")),
):
    handler = HANDLERS.get(model)
    if not handler:
        raise HTTPException(status_code=404, detail=f"Model '{model}' not supported")

    csv_content = handler.generate_template()
    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{model}-template.csv"',
        },
    )


@router.post("/tools/{model}/import")
def import_csv(
    model: str,
    file: UploadFile = File(...),
    db=Depends(get_db),
    current_user: User = Depends(require_permission("update_user")),
):
    handler = HANDLERS.get(model)
    if not handler:
        raise HTTPException(status_code=404, detail=f"Model '{model}' not supported")

    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=400, detail="Only CSV files are supported"
        )

    content = file.file.read().decode("utf-8-sig")
    rows = parse_csv(content)

    if not rows:
        raise HTTPException(status_code=400, detail="CSV file is empty or has no data rows")

    results = []
    created_count = 0
    error_count = 0

    for row in rows:
        line = row.pop("_line")
        result = handler.process_row(row, db, company_id=current_user.company_id)
        result["line"] = line
        results.append(result)
        if "created" in result:
            created_count += 1
        else:
            error_count += 1

    return {
        "total": len(rows),
        "created": created_count,
        "errors": error_count,
        "details": results,
    }
