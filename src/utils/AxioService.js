import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env' 


const AxiosService = axios.create({
    
    // baseURL:API_URL,
    baseURL:`https://worldofaat.com/api/`,
    baseURL:`http://192.168.1.66:4000/`,

    headers: {
        'Content-Type': 'application/json',
    }
})
 

AxiosService.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('token'); 
    console.log('token',token);
    
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});


export default AxiosService

//  

