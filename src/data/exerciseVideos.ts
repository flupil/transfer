// Map of exercise names to direct video URLs
// TODO: Add actual exercise video URLs here
export const exerciseVideos: { [key: string]: string | null } = {
  // For now, all videos are null
  // When you have videos hosted, replace null with the actual URLs
  'default': null
};

// Get video URL for an exercise, with fallback
export const getVideoUrl = (exerciseName: string): string | null => {
  const normalizedName = exerciseName.toLowerCase().trim();
  return exerciseVideos[normalizedName] || exerciseVideos['default'];
};