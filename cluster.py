import ollama
from sklearn.cluster import DBSCAN
import numpy as np

def cluster_themes_with_embeddings(themes, model_name="mxbai-embed-large", eps=0.1, min_samples=2):
    """
    Clusters themes using Ollama embeddings and DBSCAN with cosine metric.

    Args:
        themes: A list of themes (strings).
        model_name: The name of the Ollama embedding model to use.
        eps: The maximum distance between two samples for them to be considered
             as in the same neighborhood.
        min_samples: The minimum number of samples in a neighborhood for a point
                     to be considered as a core point.

    Returns:
        A list of lists, where each inner list represents a cluster of theme indices.
        Example return: [[0, 2], [1, 4]] means themes at index 0 and 2 belong to one cluster,
        and themes at index 1 and 4 belong to another cluster.
    """
    if not themes:
        return []

    # Generate embeddings for each theme
    # Each call returns {"embedding": [...]} so we retrieve that
    embeddings = []
    for theme in themes:
        resp = ollama.embeddings(model=model_name, prompt=theme)
        embeddings.append(resp["embedding"])

    embeddings = np.array(embeddings)

    # Apply DBSCAN clustering using cosine metric
    dbscan = DBSCAN(eps=eps, min_samples=min_samples, metric="cosine")
    labels = dbscan.fit_predict(embeddings)

    # Group theme indices into clusters
    unique_labels = set(labels)
    clusters = []
    for label in unique_labels:
        if label == -1:
            # This cluster label corresponds to noise/outliers
            continue
        cluster_indices = [i for i, lbl in enumerate(labels) if lbl == label]
        clusters.append(cluster_indices)

    return clusters
