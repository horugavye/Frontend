export function extractNumericPostId(id: string | number): string {
  if (typeof id === 'number') return id.toString();
  
  if (typeof id === 'string') {
    // Handle personal posts: "personal_123" -> "123"
    if (id.startsWith('personal_')) {
      return id.split('_')[1];
    }
    
    // Handle community posts: "community_123" -> "123"
    if (id.startsWith('community_')) {
      return id.split('_')[1];
    }
    
    // If it's already a numeric string, return as is
    if (/^\d+$/.test(id)) {
      return id;
    }
  }
  
  return id.toString();
} 