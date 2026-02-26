from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),

    # API v1
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/patients/', include('apps.patients.urls')),
    path('api/v1/diagnostics/', include('apps.diagnostics.urls')),
    path('api/v1/treatments/', include('apps.treatments.urls')),
    path('api/v1/registry/', include('apps.registry.urls')),
    path('api/v1/suivi/', include('apps.suivi.urls')),
    path('api/v1/rcp/', include('apps.rcp.urls')),
    path('api/v1/exports/', include('apps.exports.urls')),

    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
