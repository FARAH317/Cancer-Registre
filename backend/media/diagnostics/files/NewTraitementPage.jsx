import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function NewTraitementPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type');
  const patientId = searchParams.get('patient');

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [diagnostics, setDiagnostics] = useState([]);

  // Form state commun
  const [form, setForm] = useState({
    patient: patientId || '',
    diagnostic: '',
    statut: 'planifie',
    intention: 'curatif',
    date_debut: new Date().toISOString().split('T')[0],
    date_fin: '',
    etablissement: '',
    medecin: '',
    observations: '',
    // Chimio
    protocole: '',
    ligne: 1,
    nombre_cycles: '',
    cycles_realises: 0,
    intervalle_jours: '',
    voie_administration: 'iv_perf',
    reponse_tumorale: '',
    date_evaluation: '',
    toxicite_grade: '',
    toxicite_description: '',
    medicaments: [],
    // Radio
    technique: 'RTE',
    site_irradie: '',
    dose_totale_gy: '',
    dose_par_seance_gy: '',
    nombre_seances: '',
    seances_realisees: 0,
    energie_mev: '',
    association_chimio: false,
    toxicite_aigue: '',
    toxicite_tardive: '',
    // Chirurgie
    type_chirurgie: 'curative',
    intitule_acte: '',
    voie_abord: 'ouverte',
    chirurgien: '',
    marges_resection: '',
    curage_ganglionnaire: false,
    nb_ganglions_preleves: '',
    nb_ganglions_envahis: '',
    compte_rendu_operatoire: '',
    complications: '',
    duree_hospitalisation: '',
    // Hormono
    type_hormonotherapie: '',
    molecule: '',
    dose_mg_jour: '',
    duree_mois_prevue: '',
    // Immuno
    type_immunotherapie: '',
    biomarqueur_cible: '',
    dose: '',
  });

  useEffect(() => {
    loadPatients();
    if (patientId) {
      loadPatient();
      loadDiagnostics();
    }
  }, [patientId]);

  const loadPatients = async () => {
    try {
      const res = await fetch('/api/patients/');
      const data = await res.json();
      setPatients(data.results || data);
    } catch (error) {
      console.error('Erreur chargement patients');
    }
  };

  const loadPatient = async () => {
    try {
      const res = await fetch(`/api/patients/${patientId}/`);
      const data = await res.json();
      setPatient(data);
    } catch (error) {
      toast.error('Patient introuvable');
    }
  };

  const loadDiagnostics = async () => {
    try {
      const res = await fetch(`/api/diagnostics/?patient_id=${patientId}`);
      const data = await res.json();
      setDiagnostics(data.results || data);
    } catch (error) {
      console.error('Erreur chargement diagnostics');
    }
  };

  const handlePatientChange = (pid) => {
    setForm({ ...form, patient: pid, diagnostic: '' });
    if (pid) {
      loadDiagnostics();
    } else {
      setDiagnostics([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let endpoint = '';
      if (type === 'chimio') endpoint = '/api/traitements/chimiotherapies/';
      else if (type === 'radio') endpoint = '/api/traitements/radiotherapies/';
      else if (type === 'chirurgie') endpoint = '/api/traitements/chirurgies/';
      else if (type === 'hormono') endpoint = '/api/traitements/hormonotherapies/';
      else if (type === 'immuno') endpoint = '/api/traitements/immunotherapies/';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        toast.success('Traitement enregistré avec succès');
        navigate(`/traitements${patientId ? `?patient=${patientId}` : ''}`);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      toast.error('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const addMedicament = () => {
    setForm({
      ...form,
      medicaments: [
        ...form.medicaments,
        { dci: '', dose: '', unite_dose: 'mg/m2', jour_administration: '' }
      ]
    });
  };

  const removeMedicament = (index) => {
    setForm({
      ...form,
      medicaments: form.medicaments.filter((_, i) => i !== index)
    });
  };

  const updateMedicament = (index, field, value) => {
    const newMeds = [...form.medicaments];
    newMeds[index][field] = value;
    setForm({ ...form, medicaments: newMeds });
  };

  if (!type) {
    navigate('/traitements');
    return null;
  }

  const typeLabels = {
    chimio: { label: 'Chimiothérapie', icon: '💊', color: '#9b8afb' },
    radio: { label: 'Radiothérapie', icon: '⚡', color: '#f5a623' },
    chirurgie: { label: 'Chirurgie', icon: '🔪', color: '#ff4d6a' },
    hormono: { label: 'Hormonothérapie', icon: '💉', color: '#00e5a0' },
    immuno: { label: 'Immunothérapie', icon: '🧬', color: '#00a8ff' },
  };

  const currentType = typeLabels[type];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e', color: '#fff' }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '20px 24px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 32 }}>{currentType.icon}</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
              Nouveau traitement : {currentType.label}
            </h1>
          </div>
        </div>
      </div>

      {/* Patient info (si sélectionné) */}
      {patient && (
        <div style={{ maxWidth: 1200, margin: '20px auto', padding: '0 24px' }}>
          <PatientCard patient={patient} />
        </div>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit} style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '32px' }}>
          
          {/* Section commune */}
          <SectionTitle>Informations générales</SectionTitle>
          
          <FormRow>
            <FormField label="Patient" required>
              <select
                className="form-input"
                value={form.patient}
                onChange={e => handlePatientChange(e.target.value)}
                required
              >
                <option value="">-- Sélectionner un patient --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.prenom} {p.nom} ({p.registration_number})
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Diagnostic associé">
              <select
                className="form-input"
                value={form.diagnostic}
                onChange={e => handleChange('diagnostic', e.target.value)}
              >
                <option value="">-- Aucun --</option>
                {diagnostics.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.topographie_libelle} - {new Date(d.date_diagnostic).toLocaleDateString('fr-FR')}
                  </option>
                ))}
              </select>
            </FormField>
          </FormRow>

          <FormRow>
            <FormField label="Statut" required>
              <select className="form-input" value={form.statut} onChange={e => handleChange('statut', e.target.value)} required>
                <option value="planifie">Planifié</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
                <option value="suspendu">Suspendu</option>
                <option value="abandonne">Abandonné</option>
              </select>
            </FormField>

            <FormField label="Intention" required>
              <select className="form-input" value={form.intention} onChange={e => handleChange('intention', e.target.value)} required>
                <option value="curatif">Curatif</option>
                <option value="palliatif">Palliatif</option>
                <option value="adjuvant">Adjuvant</option>
                <option value="neo_adjuvant">Néo-adjuvant</option>
                <option value="prophylactique">Prophylactique</option>
              </select>
            </FormField>
          </FormRow>

          <FormRow>
            <FormField label="Date de début" required>
              <input type="date" className="form-input" value={form.date_debut} onChange={e => handleChange('date_debut', e.target.value)} required />
            </FormField>

            <FormField label="Date de fin">
              <input type="date" className="form-input" value={form.date_fin} onChange={e => handleChange('date_fin', e.target.value)} />
            </FormField>
          </FormRow>

          <FormRow>
            <FormField label="Établissement">
              <input type="text" className="form-input" value={form.etablissement} onChange={e => handleChange('etablissement', e.target.value)} placeholder="Ex: Service Oncologie - CHU Tlemcen" />
            </FormField>

            <FormField label="Médecin">
              <input type="text" className="form-input" value={form.medecin} onChange={e => handleChange('medecin', e.target.value)} placeholder="Ex: Dr. Benali" />
            </FormField>
          </FormRow>

          {/* Sections spécifiques */}
          {type === 'chimio' && <ChimioForm form={form} handleChange={handleChange} addMedicament={addMedicament} removeMedicament={removeMedicament} updateMedicament={updateMedicament} />}
          {type === 'radio' && <RadioForm form={form} handleChange={handleChange} />}
          {type === 'chirurgie' && <ChirurgieForm form={form} handleChange={handleChange} />}
          {type === 'hormono' && <HormonoForm form={form} handleChange={handleChange} />}
          {type === 'immuno' && <ImmunoForm form={form} handleChange={handleChange} />}

          {/* Observations */}
          <SectionTitle style={{ marginTop: 32 }}>Observations</SectionTitle>
          <FormField label="Notes et commentaires">
            <textarea
              className="form-input"
              rows="4"
              value={form.observations}
              onChange={e => handleChange('observations', e.target.value)}
              placeholder="Observations, effets secondaires, particularités..."
              style={{ resize: 'vertical' }}
            />
          </FormField>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 24 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              padding: '12px 24px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: '#fff',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Annuler
          </button>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 32px',
              background: loading ? '#9ca3af' : currentType.color,
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Enregistrement...' : '✓ Enregistrer le traitement'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FORMULAIRES SPÉCIFIQUES
// ═══════════════════════════════════════════════════════════════════════════

function ChimioForm({ form, handleChange, addMedicament, removeMedicament, updateMedicament }) {
  return (
    <>
      <SectionTitle style={{ marginTop: 32 }}>Protocole de chimiothérapie</SectionTitle>
      
      <FormRow>
        <FormField label="Protocole">
          <input type="text" className="form-input" value={form.protocole} onChange={e => handleChange('protocole', e.target.value)} placeholder="Ex: AC-T, FOLFOX, BEP, R-CHOP" />
        </FormField>

        <FormField label="Ligne de traitement">
          <input type="number" className="form-input" value={form.ligne} onChange={e => handleChange('ligne', e.target.value)} min="1" />
        </FormField>
      </FormRow>

      <FormRow>
        <FormField label="Nombre de cycles prévus">
          <input type="number" className="form-input" value={form.nombre_cycles} onChange={e => handleChange('nombre_cycles', e.target.value)} />
        </FormField>

        <FormField label="Cycles réalisés">
          <input type="number" className="form-input" value={form.cycles_realises} onChange={e => handleChange('cycles_realises', e.target.value)} />
        </FormField>

        <FormField label="Intervalle (jours)">
          <input type="number" className="form-input" value={form.intervalle_jours} onChange={e => handleChange('intervalle_jours', e.target.value)} placeholder="21" />
        </FormField>
      </FormRow>

      <FormField label="Voie d'administration">
        <select className="form-input" value={form.voie_administration} onChange={e => handleChange('voie_administration', e.target.value)}>
          <option value="iv_perf">IV Perfusion</option>
          <option value="iv_bolus">IV Bolus</option>
          <option value="po">Per os (oral)</option>
          <option value="sc">Sous-cutanée</option>
          <option value="im">Intramusculaire</option>
          <option value="it">Intrathécale</option>
          <option value="autre">Autre</option>
        </select>
      </FormField>

      <SectionTitle style={{ marginTop: 24 }}>Médicaments</SectionTitle>
      {form.medicaments.map((med, index) => (
        <div key={index} style={{ background: 'rgba(155,138,251,0.05)', border: '1px solid rgba(155,138,251,0.1)', borderRadius: 8, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Médicament {index + 1}</div>
            <button type="button" onClick={() => removeMedicament(index)} style={{ padding: '4px 8px', background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.2)', borderRadius: 6, color: '#ff4d6a', fontSize: 12, cursor: 'pointer' }}>
              🗑️ Retirer
            </button>
          </div>
          <FormRow>
            <FormField label="DCI (nom du médicament)">
              <input type="text" className="form-input" value={med.dci} onChange={e => updateMedicament(index, 'dci', e.target.value)} placeholder="Ex: Doxorubicine" />
            </FormField>
            <FormField label="Dose">
              <input type="number" className="form-input" value={med.dose} onChange={e => updateMedicament(index, 'dose', e.target.value)} step="0.01" />
            </FormField>
            <FormField label="Unité">
              <select className="form-input" value={med.unite_dose} onChange={e => updateMedicament(index, 'unite_dose', e.target.value)}>
                <option value="mg/m2">mg/m²</option>
                <option value="mg/kg">mg/kg</option>
                <option value="mg">mg</option>
                <option value="AUC">AUC</option>
                <option value="UI">UI</option>
              </select>
            </FormField>
            <FormField label="Jour d'administration">
              <input type="text" className="form-input" value={med.jour_administration} onChange={e => updateMedicament(index, 'jour_administration', e.target.value)} placeholder="Ex: J1, J1-J5" />
            </FormField>
          </FormRow>
        </div>
      ))}
      <button type="button" onClick={addMedicament} style={{ padding: '10px 16px', background: 'rgba(155,138,251,0.1)', border: '1px solid rgba(155,138,251,0.2)', borderRadius: 8, color: '#9b8afb', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
        + Ajouter un médicament
      </button>

      <SectionTitle style={{ marginTop: 24 }}>Évaluation de la réponse</SectionTitle>
      <FormRow>
        <FormField label="Réponse tumorale">
          <select className="form-input" value={form.reponse_tumorale} onChange={e => handleChange('reponse_tumorale', e.target.value)}>
            <option value="">-- Sélectionner --</option>
            <option value="RC">RC – Réponse Complète</option>
            <option value="RP">RP – Réponse Partielle</option>
            <option value="SD">SD – Stabilisation</option>
            <option value="PD">PD – Progression</option>
            <option value="NE">NE – Non Évaluable</option>
          </select>
        </FormField>
        <FormField label="Date d'évaluation">
          <input type="date" className="form-input" value={form.date_evaluation} onChange={e => handleChange('date_evaluation', e.target.value)} />
        </FormField>
      </FormRow>

      <FormRow>
        <FormField label="Toxicité (grade)">
          <select className="form-input" value={form.toxicite_grade} onChange={e => handleChange('toxicite_grade', e.target.value)}>
            <option value="">-- Aucune --</option>
            <option value="0">0</option>
            <option value="1">1 – Légère</option>
            <option value="2">2 – Modérée</option>
            <option value="3">3 – Sévère</option>
            <option value="4">4 – Engageant le pronostic vital</option>
            <option value="5">5 – Décès</option>
          </select>
        </FormField>
        <FormField label="Description toxicité">
          <textarea className="form-input" rows="2" value={form.toxicite_description} onChange={e => handleChange('toxicite_description', e.target.value)} placeholder="Description des effets secondaires..." style={{ resize: 'vertical' }} />
        </FormField>
      </FormRow>
    </>
  );
}

function RadioForm({ form, handleChange }) {
  return (
    <>
      <SectionTitle style={{ marginTop: 32 }}>Radiothérapie</SectionTitle>
      
      <FormRow>
        <FormField label="Technique" required>
          <select className="form-input" value={form.technique} onChange={e => handleChange('technique', e.target.value)} required>
            <option value="RTE">Radiothérapie externe (RTE)</option>
            <option value="RCMI">RCMI (modulation d'intensité)</option>
            <option value="STRT">Stéréotaxie (SBRT/SRST)</option>
            <option value="curie">Curiethérapie</option>
            <option value="RTE_3D">RTE conformationnelle 3D</option>
            <option value="tomo">Tomothérapie</option>
            <option value="cyber">CyberKnife</option>
            <option value="proton">Protonthérapie</option>
            <option value="autre">Autre</option>
          </select>
        </FormField>

        <FormField label="Site irradié" required>
          <input type="text" className="form-input" value={form.site_irradie} onChange={e => handleChange('site_irradie', e.target.value)} placeholder="Ex: Sein gauche, Pelvis" required />
        </FormField>
      </FormRow>

      <FormRow>
        <FormField label="Dose totale (Gy)">
          <input type="number" className="form-input" value={form.dose_totale_gy} onChange={e => handleChange('dose_totale_gy', e.target.value)} step="0.01" placeholder="Ex: 50" />
        </FormField>

        <FormField label="Dose par séance (Gy)">
          <input type="number" className="form-input" value={form.dose_par_seance_gy} onChange={e => handleChange('dose_par_seance_gy', e.target.value)} step="0.01" placeholder="Ex: 2" />
        </FormField>
      </FormRow>

      <FormRow>
        <FormField label="Nombre de séances prévues">
          <input type="number" className="form-input" value={form.nombre_seances} onChange={e => handleChange('nombre_seances', e.target.value)} />
        </FormField>

        <FormField label="Séances réalisées">
          <input type="number" className="form-input" value={form.seances_realisees} onChange={e => handleChange('seances_realisees', e.target.value)} />
        </FormField>

        <FormField label="Énergie (MeV)">
          <input type="text" className="form-input" value={form.energie_mev} onChange={e => handleChange('energie_mev', e.target.value)} placeholder="Ex: 6MV, 15MV" />
        </FormField>
      </FormRow>

      <FormField label="Radiochimiothérapie concomitante">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.association_chimio} onChange={e => handleChange('association_chimio', e.target.checked)} />
          <span style={{ fontSize: 14 }}>Oui, en association avec chimiothérapie</span>
        </label>
      </FormField>

      <FormRow>
        <FormField label="Toxicité aiguë">
          <textarea className="form-input" rows="2" value={form.toxicite_aigue} onChange={e => handleChange('toxicite_aigue', e.target.value)} placeholder="Effets secondaires pendant le traitement..." style={{ resize: 'vertical' }} />
        </FormField>

        <FormField label="Toxicité tardive">
          <textarea className="form-input" rows="2" value={form.toxicite_tardive} onChange={e => handleChange('toxicite_tardive', e.target.value)} placeholder="Effets secondaires après le traitement..." style={{ resize: 'vertical' }} />
        </FormField>
      </FormRow>
    </>
  );
}

function ChirurgieForm({ form, handleChange }) {
  return (
    <>
      <SectionTitle style={{ marginTop: 32 }}>Chirurgie</SectionTitle>
      
      <FormRow>
        <FormField label="Type de chirurgie" required>
          <select className="form-input" value={form.type_chirurgie} onChange={e => handleChange('type_chirurgie', e.target.value)} required>
            <option value="curative">Chirurgie curative</option>
            <option value="palliative">Chirurgie palliative</option>
            <option value="cyto">Chirurgie cytoréductrice</option>
            <option value="recons">Chirurgie reconstructrice</option>
            <option value="diagnostic">Chirurgie diagnostique / biopsie</option>
            <option value="ganglion">Curage ganglionnaire</option>
            <option value="autre">Autre</option>
          </select>
        </FormField>

        <FormField label="Voie d'abord">
          <select className="form-input" value={form.voie_abord} onChange={e => handleChange('voie_abord', e.target.value)}>
            <option value="ouverte">Chirurgie ouverte</option>
            <option value="laparo">Laparoscopie</option>
            <option value="thoraco">Thoracoscopie</option>
            <option value="robot">Chirurgie robotique</option>
            <option value="endo">Endoscopie</option>
            <option value="autre">Autre</option>
          </select>
        </FormField>
      </FormRow>

      <FormField label="Intitulé de l'acte" required>
        <input type="text" className="form-input" value={form.intitule_acte} onChange={e => handleChange('intitule_acte', e.target.value)} placeholder="Ex: Mastectomie totale gauche + GS" required />
      </FormField>

      <FormRow>
        <FormField label="Chirurgien">
          <input type="text" className="form-input" value={form.chirurgien} onChange={e => handleChange('chirurgien', e.target.value)} placeholder="Ex: Dr. Benali" />
        </FormField>

        <FormField label="Marges de résection">
          <select className="form-input" value={form.marges_resection} onChange={e => handleChange('marges_resection', e.target.value)}>
            <option value="">-- Sélectionner --</option>
            <option value="R0">R0 – Résection complète (marges saines)</option>
            <option value="R1">R1 – Résection microscopiquement incomplète</option>
            <option value="R2">R2 – Résection macroscopiquement incomplète</option>
            <option value="RX">RX – Non évaluable</option>
          </select>
        </FormField>
      </FormRow>

      <FormField label="Curage ganglionnaire">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.curage_ganglionnaire} onChange={e => handleChange('curage_ganglionnaire', e.target.checked)} />
          <span style={{ fontSize: 14 }}>Curage ganglionnaire réalisé</span>
        </label>
      </FormField>

      {form.curage_ganglionnaire && (
        <FormRow>
          <FormField label="Nombre de ganglions prélevés">
            <input type="number" className="form-input" value={form.nb_ganglions_preleves} onChange={e => handleChange('nb_ganglions_preleves', e.target.value)} />
          </FormField>

          <FormField label="Nombre de ganglions envahis">
            <input type="number" className="form-input" value={form.nb_ganglions_envahis} onChange={e => handleChange('nb_ganglions_envahis', e.target.value)} />
          </FormField>
        </FormRow>
      )}

      <FormField label="Compte-rendu opératoire">
        <textarea className="form-input" rows="4" value={form.compte_rendu_operatoire} onChange={e => handleChange('compte_rendu_operatoire', e.target.value)} placeholder="Description de l'intervention..." style={{ resize: 'vertical' }} />
      </FormField>

      <FormRow>
        <FormField label="Complications">
          <textarea className="form-input" rows="2" value={form.complications} onChange={e => handleChange('complications', e.target.value)} placeholder="Complications post-opératoires..." style={{ resize: 'vertical' }} />
        </FormField>

        <FormField label="Durée d'hospitalisation (jours)">
          <input type="number" className="form-input" value={form.duree_hospitalisation} onChange={e => handleChange('duree_hospitalisation', e.target.value)} />
        </FormField>
      </FormRow>
    </>
  );
}

function HormonoForm({ form, handleChange }) {
  return (
    <>
      <SectionTitle style={{ marginTop: 32 }}>Hormonothérapie</SectionTitle>
      
      <FormRow>
        <FormField label="Type d'hormonothérapie" required>
          <select className="form-input" value={form.type_hormonotherapie} onChange={e => handleChange('type_hormonotherapie', e.target.value)} required>
            <option value="">-- Sélectionner --</option>
            <option value="anti_estro">Anti-estrogène (Tamoxifène)</option>
            <option value="anti_andro">Anti-androgène</option>
            <option value="aromatase">Inhibiteur de l'aromatase</option>
            <option value="lhrh">Analogue LH-RH</option>
            <option value="progest">Progestatif</option>
            <option value="autre">Autre</option>
          </select>
        </FormField>

        <FormField label="Molécule" required>
          <input type="text" className="form-input" value={form.molecule} onChange={e => handleChange('molecule', e.target.value)} placeholder="Ex: Tamoxifène, Anastrozole" required />
        </FormField>
      </FormRow>

      <FormRow>
        <FormField label="Dose (mg/jour)">
          <input type="number" className="form-input" value={form.dose_mg_jour} onChange={e => handleChange('dose_mg_jour', e.target.value)} step="0.01" placeholder="Ex: 20" />
        </FormField>

        <FormField label="Durée prévue (mois)">
          <input type="number" className="form-input" value={form.duree_mois_prevue} onChange={e => handleChange('duree_mois_prevue', e.target.value)} placeholder="Ex: 60" />
        </FormField>
      </FormRow>
    </>
  );
}

function ImmunoForm({ form, handleChange }) {
  return (
    <>
      <SectionTitle style={{ marginTop: 32 }}>Immunothérapie / Thérapie ciblée</SectionTitle>
      
      <FormRow>
        <FormField label="Type" required>
          <select className="form-input" value={form.type_immunotherapie} onChange={e => handleChange('type_immunotherapie', e.target.value)} required>
            <option value="">-- Sélectionner --</option>
            <option value="checkpoint">Inhibiteur de checkpoint</option>
            <option value="anti_her2">Anti-HER2 (Trastuzumab...)</option>
            <option value="anti_vegf">Anti-VEGF (Bevacizumab...)</option>
            <option value="anti_egfr">Anti-EGFR (Cetuximab...)</option>
            <option value="imatinib">Inhibiteur de tyrosine kinase</option>
            <option value="cart">CAR-T Cell</option>
            <option value="autre">Autre</option>
          </select>
        </FormField>

        <FormField label="Molécule" required>
          <input type="text" className="form-input" value={form.molecule} onChange={e => handleChange('molecule', e.target.value)} placeholder="Ex: Pembrolizumab, Trastuzumab" required />
        </FormField>
      </FormRow>

      <FormRow>
        <FormField label="Dose">
          <input type="text" className="form-input" value={form.dose} onChange={e => handleChange('dose', e.target.value)} placeholder="Ex: 200mg IV toutes les 3 semaines" />
        </FormField>

        <FormField label="Nombre de cycles">
          <input type="number" className="form-input" value={form.nombre_cycles} onChange={e => handleChange('nombre_cycles', e.target.value)} />
        </FormField>
      </FormRow>

      <FormField label="Biomarqueur cible">
        <input type="text" className="form-input" value={form.biomarqueur_cible} onChange={e => handleChange('biomarqueur_cible', e.target.value)} placeholder="Ex: PDL1, HER2, EGFR, BRAF" />
      </FormField>

      <FormField label="Réponse tumorale">
        <select className="form-input" value={form.reponse_tumorale} onChange={e => handleChange('reponse_tumorale', e.target.value)}>
          <option value="">-- Sélectionner --</option>
          <option value="RC">RC – Réponse Complète</option>
          <option value="RP">RP – Réponse Partielle</option>
          <option value="SD">SD – Stabilisation</option>
          <option value="PD">PD – Progression</option>
          <option value="NE">NE – Non Évaluable</option>
        </select>
      </FormField>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSANTS UTILITAIRES
// ═══════════════════════════════════════════════════════════════════════════

function PatientCard({ patient }) {
  return (
    <div style={{
      background: 'rgba(0,168,255,0.1)',
      border: '1px solid rgba(0,168,255,0.3)',
      borderRadius: 12,
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
    }}>
      <div style={{
        width: 50,
        height: 50,
        borderRadius: '50%',
        background: 'rgba(0,168,255,0.2)',
        border: '2px solid rgba(0,168,255,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 20,
        fontWeight: 700,
        color: '#00a8ff',
      }}>
        {patient.prenom?.charAt(0)}{patient.nom?.charAt(0)}
      </div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#00a8ff', marginBottom: 4 }}>
          {patient.prenom} {patient.nom}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
          {patient.registration_number} · {patient.age} ans · {patient.sexe === 'M' ? 'Masculin' : 'Féminin'}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children, style }) {
  return (
    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#9b8afb', marginBottom: 16, marginTop: 0, ...style }}>
      {children}
    </h3>
  );
}

function FormRow({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 20 }}>{children}</div>;
}

function FormField({ label, required, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb' }}>
        {label} {required && <span style={{ color: '#ff4d6a' }}>*</span>}
      </label>
      {children}
    </div>
  );
}