import { Application, OutputArtifact } from './types';

export function addOutputArtifact(application: Application, artifact: OutputArtifact): void {
  if (application.resources) {
    application.resources = [
      ...application.resources.filter(r => r.id !== artifact.id),
      artifact
    ];
  }
}
