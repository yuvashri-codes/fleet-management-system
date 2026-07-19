from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    VehicleViewSet, DriverViewSet, GlobalSearchView,
    TripViewSet, FuelLogViewSet, MaintenanceViewSet,
    DashboardStatsView, DashboardKPIView, DashboardChartsView,
    DashboardRecentActivitiesView, DashboardNotificationsView,
    FleetReportView, VehicleReportView, DriverReportView,
    TripsReportView, FuelReportView, MaintenanceReportView,
    AIPredictiveMaintenanceView, AIFuelPredictionView, AIDriverScoreView,
    AIFleetHealthView, AICostForecastView, AIRecommendationsView,
    AuditLogListView, SystemSettingsDetailView, DatabaseBackupExportView, DatabaseBackupImportView
)

router = DefaultRouter()
router.register(r'vehicles', VehicleViewSet, basename='vehicle')
router.register(r'drivers', DriverViewSet, basename='driver')
router.register(r'trips', TripViewSet, basename='trip')
router.register(r'fuel', FuelLogViewSet, basename='fuel')
router.register(r'maintenance', MaintenanceViewSet, basename='maintenance')

urlpatterns = [
    path('global-search/', GlobalSearchView.as_view(), name='global-search'),
    path('dashboard/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('dashboard/kpi/', DashboardKPIView.as_view(), name='dashboard-kpi'),
    path('dashboard/charts/', DashboardChartsView.as_view(), name='dashboard-charts'),
    path('dashboard/recent-activities/', DashboardRecentActivitiesView.as_view(), name='dashboard-recent-activities'),
    path('dashboard/notifications/', DashboardNotificationsView.as_view(), name='dashboard-notifications'),
    path('reports/fleet/', FleetReportView.as_view(), name='report-fleet'),
    path('reports/vehicle/', VehicleReportView.as_view(), name='report-vehicle'),
    path('reports/driver/', DriverReportView.as_view(), name='report-driver'),
    path('reports/trips/', TripsReportView.as_view(), name='report-trips'),
    path('reports/fuel/', FuelReportView.as_view(), name='report-fuel'),
    path('reports/maintenance/', MaintenanceReportView.as_view(), name='report-maintenance'),
    
    # AI Predictions Gateway endpoints
    path('ai/maintenance/', AIPredictiveMaintenanceView.as_view(), name='ai-maintenance'),
    path('ai/fuel/', AIFuelPredictionView.as_view(), name='ai-fuel'),
    path('ai/driver-score/', AIDriverScoreView.as_view(), name='ai-driver-score'),
    path('ai/fleet-health/', AIFleetHealthView.as_view(), name='ai-fleet-health'),
    path('ai/cost-forecast/', AICostForecastView.as_view(), name='ai-cost-forecast'),
    path('ai/recommendations/', AIRecommendationsView.as_view(), name='ai-recommendations'),

    # Audit Logs, Settings & Database Backup endpoints
    path('audit-logs/', AuditLogListView.as_view(), name='audit-logs'),
    path('settings/', SystemSettingsDetailView.as_view(), name='system-settings'),
    path('backup/export/', DatabaseBackupExportView.as_view(), name='backup-export'),
    path('backup/import/', DatabaseBackupImportView.as_view(), name='backup-import'),

    path('', include(router.urls)),
]
