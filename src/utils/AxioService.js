import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, EXPO_PUBLIC_API_URL } from '@env';

const activeUrl = API_URL || EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_URL || 'https://worldofaat.com/api';
//const activeUrl = API_URL || EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.41:4000/api';
console.log('Axios baseURL being used:', activeUrl);

const AxiosService = axios.create({
    baseURL: activeUrl,
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
    }
});


AxiosService.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('token');
    console.log('token', token);

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});


export const getCorrectImageUrl = (url) => {
    if (!url) return null;
    if (typeof url !== 'string') return url;

    let filename = "";
    const idx = url.indexOf('/uploads/');
    if (idx !== -1) {
        filename = url.substring(idx + 9);
    } else if (url.includes('uploads/')) {
        const idx2 = url.indexOf('uploads/');
        filename = url.substring(idx2 + 8);
    } else {
        filename = url.substring(url.lastIndexOf('/') + 1);
    }

    const cleanBase = (activeUrl || 'https://worldofaat.com/api').replace(/\/$/, "");
    return `${cleanBase}/uploads/${filename}`;
};

export default AxiosService;

//  

