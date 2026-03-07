from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ChimiotherapieViewSet, RadiotherapieViewSet,
    ChirurgieViewSet, HormonotherapieViewSet,
    ImmunotherapieViewSet, TraitementsViewSet,
)

router = DefaultRouter()
router.register(r'chimiotherapies',  ChimiotherapieViewSet,  basename='chimio')
router.register(r'radiotherapies',   RadiotherapieViewSet,   basename='radio')
router.register(r'chirurgies',       ChirurgieViewSet,       basename='chirurgie')
router.register(r'hormonotherapies', HormonotherapieViewSet, basename='hormono')
router.register(r'immunotherapies',  ImmunotherapieViewSet,  basename='immuno')
router.register(r'',                 TraitementsViewSet,     basename='traitements')

urlpatterns = [
    path('', include(router.urls)),
]