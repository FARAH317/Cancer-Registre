from django.urls import path
from . import views

urlpatterns = [
    path('info/',                        views.exports_info,              name='exports-info'),
    # Excel
    path('excel/patients/',              views.export_patients_excel,     name='export-patients-xlsx'),
    path('excel/diagnostics/',           views.export_diagnostics_excel,  name='export-diagnostics-xlsx'),
    path('excel/rapport/',               views.export_rapport_excel,      name='export-rapport-xlsx'),
    path('canreg5/',                     views.export_canreg5,            name='export-canreg5'),
    # PDF
    path('pdf/patient/<int:patient_id>/',views.export_fiche_patient_pdf,  name='export-fiche-pdf'),
    path('pdf/rapport/',                 views.export_rapport_pdf,        name='export-rapport-pdf'),
]
