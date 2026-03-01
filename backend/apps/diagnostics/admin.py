from django.contrib import admin
from .models import Diagnostic, TopographieICD, MorphologieICD


@admin.register(TopographieICD)
class TopographieAdmin(admin.ModelAdmin):
    list_display  = ['code', 'libelle', 'categorie', 'est_actif']
    list_filter   = ['categorie', 'est_actif']
    search_fields = ['code', 'libelle']


@admin.register(MorphologieICD)
class MorphologieAdmin(admin.ModelAdmin):
    list_display  = ['code', 'libelle', 'comportement', 'groupe', 'est_actif']
    list_filter   = ['comportement', 'groupe', 'est_actif']
    search_fields = ['code', 'libelle']


@admin.register(Diagnostic)
class DiagnosticAdmin(admin.ModelAdmin):
    list_display  = ['patient', 'date_diagnostic', 'topographie_code',
                     'morphologie_code', 'stade_ajcc', 'get_tnm_display_full']
    list_filter   = ['stade_ajcc', 'lateralite', 'base_diagnostic', 'tnm_type']
    search_fields = ['patient__nom', 'patient__registration_number',
                     'topographie_code', 'morphologie_code']
    raw_id_fields = ['patient', 'topographie', 'morphologie']
    readonly_fields = ['date_creation', 'date_modification', 'topographie_code',
                       'topographie_libelle', 'morphologie_code', 'morphologie_libelle']

    fieldsets = (
        ('Patient & Date', {
            'fields': ('patient', 'date_diagnostic', 'date_premier_symptome',
                       'base_diagnostic', 'est_principal')
        }),
        ('Topographie ICD-O-3', {
            'fields': ('topographie', 'topographie_code', 'topographie_libelle', 'lateralite')
        }),
        ('Morphologie ICD-O-3', {
            'fields': ('morphologie', 'morphologie_code', 'morphologie_libelle', 'grade_histologique')
        }),
        ('Classification TNM 8e éd.', {
            'fields': ('tnm_type', 'tnm_t', 'tnm_n', 'tnm_m', 'tnm_edition', 'stade_ajcc')
        }),
        ('Marqueurs biologiques', {
            'fields': ('recepteur_re', 'recepteur_rp', 'her2', 'ki67', 'psa', 'autres_marqueurs'),
            'classes': ('collapse',)
        }),
        ('Mesures & Métastases', {
            'fields': ('taille_tumeur', 'nombre_ganglions', 'metastases_sites'),
            'classes': ('collapse',)
        }),
        ('Établissement', {
            'fields': ('etablissement_diagnostic', 'medecin_diagnostiqueur',
                       'numero_bloc_anapath', 'cim10_code', 'cim10_libelle'),
            'classes': ('collapse',)
        }),
        ('Notes', {'fields': ('observations',)}),
    )
