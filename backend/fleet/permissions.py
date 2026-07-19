from rest_framework import permissions

class FleetModulePermission(permissions.BasePermission):
    """
    Role-Based Access Control for the Fleet module:
    - Admin: Full Access (GET, POST, PUT, PATCH, DELETE)
    - Fleet Manager: Create, Edit, View (GET, POST, PUT, PATCH) - NO DELETE
    - Driver: Read Only (GET)
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        # Admin / Superuser has full access
        if request.user.role == 'ADMIN' or request.user.is_superuser:
            return True
            
        # Driver has read-only access (GET, HEAD, OPTIONS)
        if request.user.role == 'DRIVER':
            return request.method in permissions.SAFE_METHODS
            
        # Fleet Manager has safe methods plus POST, PUT, PATCH (create, edit, view)
        if request.user.role == 'FLEET_MANAGER':
            return request.method in permissions.SAFE_METHODS or request.method in ['POST', 'PUT', 'PATCH']
            
        return False


class IsAdminOrFleetManager(permissions.BasePermission):
    """
    Allows access only to Admin and Fleet Manager roles.
    Drivers are completely blocked.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['ADMIN', 'FLEET_MANAGER'] or request.user.is_superuser
