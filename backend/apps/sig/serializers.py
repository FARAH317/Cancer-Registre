from rest_framework import serializers
from .models import (
    Wilaya, Commune, FacteurRisque,
    StatCancerWilaya, StatCancerCommune, AlerteEpidemiologique,
)


class CommuneSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Commune
        fields = ['code', 'nom', 'nom_ar', 'latitude', 'longitude',
                  'population', 'est_chef_lieu']


class FacteurRisqueSerializer(serializers.ModelSerializer):
    niveau_display = serializers.CharField(source='get_niveau_display', read_only=True)
    niveau_fr      = serializers.SerializerMethodField()
    wilaya_nom     = serializers.CharField(source='wilaya.nom', read_only=True, default=None)

    class Meta:
        model  = FacteurRisque
        fields = ['id', 'portee', 'wilaya', 'wilaya_nom', 'region',
                  'nom', 'description', 'niveau', 'niveau_display', 'niveau_fr',
                  'icone', 'source', 'actif', 'ordre']

    def get_niveau_fr(self, obj):
        return obj.niveau_display_fr()


class StatCancerWilayaSerializer(serializers.ModelSerializer):
    cancer_principal = serializers.CharField(read_only=True)
    top_cancers      = serializers.ListField(read_only=True)

    class Meta:
        model  = StatCancerWilaya
        fields = ['id', 'wilaya', 'annee', 'total_patients',
                  'total_hommes', 'total_femmes', 'total_nouveaux', 'total_deces',
                  'incidence_pour_100k', 'cancers_json', 'communes_json',
                  'cancer_principal', 'top_cancers', 'date_calcul', 'est_complet']
        read_only_fields = ['date_calcul']


class AlerteSerializer(serializers.ModelSerializer):
    wilaya_nom     = serializers.CharField(source='wilaya.nom', read_only=True)
    niveau_display = serializers.CharField(source='get_niveau_display', read_only=True)
    cree_par_nom   = serializers.SerializerMethodField()

    class Meta:
        model  = AlerteEpidemiologique
        fields = ['id', 'wilaya', 'wilaya_nom', 'niveau', 'niveau_display',
                  'type_cancer', 'titre', 'description',
                  'date_debut', 'date_fin', 'active', 'date_creation', 'cree_par_nom']
        read_only_fields = ['date_creation', 'cree_par']

    def get_cree_par_nom(self, obj):
        if obj.cree_par:
            return obj.cree_par.get_full_name() or obj.cree_par.username
        return None


class WilayaListSerializer(serializers.ModelSerializer):
    region_label = serializers.CharField(source='get_region_display', read_only=True)

    class Meta:
        model  = Wilaya
        fields = ['code', 'nom', 'nom_ar', 'region', 'region_label',
                  'chef_lieu', 'latitude', 'longitude',
                  'superficie_km2', 'population', 'nb_communes']


class WilayaDetailSerializer(serializers.ModelSerializer):
    region_label  = serializers.CharField(source='get_region_display', read_only=True)
    communes      = CommuneSerializer(many=True, read_only=True)
    facteurs_risque = FacteurRisqueSerializer(many=True, read_only=True)
    stats_cancer  = StatCancerWilayaSerializer(many=True, read_only=True)
    alertes_actives = serializers.SerializerMethodField()
    total_patients  = serializers.SerializerMethodField()
    incidence_pour_100k = serializers.SerializerMethodField()

    class Meta:
        model  = Wilaya
        fields = ['code', 'nom', 'nom_ar', 'region', 'region_label',
                  'chef_lieu', 'latitude', 'longitude',
                  'superficie_km2', 'population', 'nb_communes',
                  'communes', 'facteurs_risque', 'stats_cancer',
                  'alertes_actives', 'total_patients', 'incidence_pour_100k']

    def get_alertes_actives(self, obj):
        return AlerteSerializer(obj.alertes.filter(active=True), many=True).data

    def get_total_patients(self, obj):
        return obj.total_patients

    def get_incidence_pour_100k(self, obj):
        return obj.incidence_pour_100k