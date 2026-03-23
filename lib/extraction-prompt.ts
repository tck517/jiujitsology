import type { OntologyEntry } from "@/lib/ontology";

export function buildExtractionPrompt(
  ontologyEntries: OntologyEntry[],
  transcriptionText: string
): string {
  const nodeTypes = ontologyEntries
    .filter((e) => e.category === "node_type")
    .map((e) => `- ${e.name}: ${e.description || "No description"}`)
    .join("\n");

  const edgeTypes = ontologyEntries
    .filter((e) => e.category === "edge_type")
    .map((e) => `- ${e.name}: ${e.description || "No description"}`)
    .join("\n");

  return `You are a Brazilian Jiu-Jitsu knowledge extraction expert. Your task is to extract structured knowledge from BJJ instructional video transcriptions.

## Ontology

### Valid Node Types
${nodeTypes}

### Valid Edge Types
${edgeTypes}

## Rules

1. Only use node types and edge types from the ontology above. Do not invent new types.
2. Use concise, canonical labels for nodes (e.g., "Armbar" not "The armbar from closed guard").
3. If the same technique/position is mentioned multiple times, use the same label consistently.
4. Extract relationships between techniques — how they connect, transition, counter, or chain together.
5. Include the instructor name if mentioned.
6. Include the instructional title if mentioned.
7. For properties, only include information explicitly stated in the transcription.
8. Be thorough — extract all techniques, positions, and concepts discussed, not just the main ones.

## Transcription

${transcriptionText}

## Output

Extract all BJJ knowledge from the transcription above. Return a JSON object with "nodes" and "edges" arrays.`;
}
