import type { ProgressInfo } from '../hooks/useGtfs';

const phaseLabels: Record<string, string> = {
  checking_cache: 'Vérification du cache...',
  loading_from_cache: 'Chargement depuis le cache...',
  downloading: 'Téléchargement du GTFS...',
  extracting: 'Extraction des fichiers...',
  creating_schema: 'Création du schéma...',
  inserting_data: 'Import des données...',
  creating_indexes: 'Création des index...',
  analyzing: 'Analyse...',
  loading_realtime: 'Chargement temps réel...',
  saving_cache: 'Sauvegarde du cache...',
  complete: 'Terminé !',
};

interface Props {
  progress: ProgressInfo | null;
  error: string | null;
}

export function LoadingScreen({ progress, error }: Props) {
  if (error) {
    return (
      <div className="loading-screen">
        <div className="loading-error">
          <h2>Erreur de chargement</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Réessayer</button>
        </div>
      </div>
    );
  }

  const percent = progress?.percentComplete ?? 0;
  const phase = progress?.phase ?? 'downloading';
  const label = phaseLabels[phase] || progress?.message || 'Chargement...';
  const currentFile = progress?.currentFile;

  return (
    <div className="loading-screen">
      <h1>Correspondances Car Jaune</h1>
      <div className="loading-bar-container">
        <div className="loading-bar" style={{ width: `${percent}%` }} />
      </div>
      <p className="loading-label">{label}</p>
      {currentFile && <p className="loading-file">{currentFile}</p>}
      <p className="loading-percent">{Math.round(percent)}%</p>
    </div>
  );
}
