from django.contrib import admin
from .models import (
    Chimiotherapie, MedicamentChimio,
    Radiotherapie, Chirurgie,
    Hormonotherapie, Immunotherapie,
)


class MedicamentInline(admin.TabularInline):
    model = MedicamentChimio
    extra = 1


@admin.register(Chimiotherapie)
class ChimioAdmin(admin.ModelAdmin):
    list_display  = ['patient', 'protocole', 'ligne', 'statut', 'date_debut', 'cycles_realises', 'reponse_tumorale']
    list_filter   = ['statut', 'intention', 'reponse_tumorale']
    search_fields = ['patient__nom', 'protocole']
    inlines       = [MedicamentInline]
    raw_id_fields = ['patient', 'diagnostic']


@admin.register(Radiotherapie)
class RadioAdmin(admin.ModelAdmin):
    list_display  = ['patient', 'site_irradie', 'technique', 'dose_totale_gy', 'statut', 'date_debut']
    list_filter   = ['technique', 'statut', 'intention']
    search_fields = ['patient__nom', 'site_irradie']
    raw_id_fields = ['patient', 'diagnostic']


@admin.register(Chirurgie)
class ChirAdmin(admin.ModelAdmin):
    list_display  = ['patient', 'intitule_acte', 'type_chirurgie', 'marges_resection', 'date_debut']
    list_filter   = ['type_chirurgie', 'marges_resection', 'voie_abord', 'statut']
    search_fields = ['patient__nom', 'intitule_acte']
    raw_id_fields = ['patient', 'diagnostic']


@admin.register(Hormonotherapie)
class HormonoAdmin(admin.ModelAdmin):
    list_display  = ['patient', 'molecule', 'type_hormonotherapie', 'statut', 'date_debut']
    list_filter   = ['type_hormonotherapie', 'statut']
    search_fields = ['patient__nom', 'molecule']
    raw_id_fields = ['patient', 'diagnostic']


@admin.register(Immunotherapie)
class ImmunoAdmin(admin.ModelAdmin):
    list_display  = ['patient', 'molecule', 'type_immunotherapie', 'biomarqueur_cible', 'statut', 'date_debut']
    list_filter   = ['type_immunotherapie', 'statut']
    search_fields = ['patient__nom', 'molecule', 'biomarqueur_cible']
    raw_id_fields = ['patient', 'diagnostic']
