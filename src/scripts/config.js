const CONFIG = {
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://story-api.dicoding.dev/v1' 
    : '/v1', // Use proxy for development
      
  DIRECT_API_URL: 'https://story-api.dicoding.dev/v1',
};

export default CONFIG;
