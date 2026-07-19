from .models import AuditLog

def log_audit(action, user, request=None, details=""):
    ip_address = None
    if request:
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0].strip()
        else:
            ip_address = request.META.get('REMOTE_ADDR')
            
    AuditLog.objects.create(
        action=action,
        user=user if user and user.is_authenticated else None,
        ip_address=ip_address,
        details=details
    )
