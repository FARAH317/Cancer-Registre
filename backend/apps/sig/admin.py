from django.contrib import admin
from .models import (
    Wilaya, Commune, FacteurRisque,
    StatCancerWilaya, StatCancerCommune, AlerteEpidemiologique,
)


class CommuneInline(admin.TabularInline):
    model  = Commune
    extra  = 0
    fields = ['code', 'nom', 'est_chef_lieu', 'latitude', 'longitude', 'population']


class FacteurRisqueInline(admin.TabularInline):
    model  = FacteurRisque
    extra  = 0
    fields = ['nom', 'niveau', 'icone', 'portee', 'actif', 'ordre']


@admin.register(Wilaya)
class WilayaAdmin(admin.ModelAdmin):
    list_display    = ['code', 'nom', 'region', 'chef_lieu', 'population', 'superficie_km2']
    list_filter     = ['region']
    search_fields   = ['nom', 'chef_lieu']
    ordering        = ['code']
    inlines         = [CommuneInline, FacteurRisqueInline]
    readonly_fields = ['date_creation', 'date_modification']
    fieldsets = (
        ('Identification', {
            'fields': ('code', 'nom', 'nom_ar', 'region', 'chef_lieu')
        }),
        ('Géographie', {
            'fields': ('latitude', 'longitude', 'superficie_km2', 'population', 'nb_communes')
        }),
        ('Métadonnées', {
            'fields': ('date_creation', 'date_modification'),
            'classes': ('collapse',),
        }),
    )


@admin.register(FacteurRisque)
class FacteurRisqueAdmin(admin.ModelAdmin):
    list_display  = ['nom', 'niveau', 'portee', 'region', 'wilaya', 'icone', 'actif', 'ordre']
    list_filter   = ['niveau', 'portee', 'region', 'actif']
    search_fields = ['nom', 'description']
    list_editable = ['actif', 'ordre']


@admin.register(StatCancerWilaya)
class StatCancerWilayaAdmin(admin.ModelAdmin):
    list_display  = ['wilaya', 'annee', 'total_patients', 'incidence_pour_100k', 'est_complet', 'date_calcul']
    list_filter   = ['annee', 'est_complet']
    search_fields = ['wilaya__nom']
    readonly_fields = ['date_calcul']

    actions = ['recalculer_stats']

    @admin.action(description='Recalculer les statistiques sélectionnées')
    def recalculer_stats(self, request, queryset):
        for stat in queryset:
            StatCancerWilaya.calculer_et_sauvegarder(stat.wilaya.code, stat.annee)
        self.message_user(request, f'{queryset.count()} statistiques recalculées.')


@admin.register(AlerteEpidemiologique)
class AlerteAdmin(admin.ModelAdmin):
    list_display  = ['titre', 'wilaya', 'niveau', 'type_cancer', 'date_debut', 'active']
    list_filter   = ['niveau', 'active', 'type_cancer']
    search_fields = ['titre', 'wilaya__nom']
    raw_id_fields = ['wilaya', 'cree_par']
    list_editable = ['active']