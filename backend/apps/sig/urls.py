# backend/apps/sig/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    sig_overview, sig_wilaya_detail, sig_stats_nationales,
    WilayaViewSet, FacteurRisqueViewSet, AlerteViewSet,
)

router = DefaultRouter()
router.register(r'wilayas',         WilayaViewSet,         basename='sig-wilaya')
router.register(r'facteurs-risque', FacteurRisqueViewSet,  basename='sig-facteur')
router.register(r'alertes',         AlerteViewSet,         basename='sig-alerte')

urlpatterns = [
    # Vues fonctionnelles (carte interactive)
    path('overview/',                  sig_overview,         name='sig-overview'),
    path('wilaya/<int:wilaya_code>/',  sig_wilaya_detail,    name='sig-wilaya-detail'),
    path('stats-nationales/',          sig_stats_nationales, name='sig-stats-nationales'),
    # CRUD admin
    path('', include(router.urls)),
]