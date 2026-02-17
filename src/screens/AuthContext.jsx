import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Image, ToastAndroid } from 'react-native';
import {jwtDecode} from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => { 
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuthToken = async () => {
            try {
                const token = await AsyncStorage.getItem('token');

                if (token) {
                    const decoded = jwtDecode(token);
                    const currentTime = Date.now() / 1000;

                    if (decoded.exp < currentTime) {
                        await AsyncStorage.removeItem('token');
                        setIsAuthenticated(false);
                        ToastAndroid.show("Session Expired. Please log in again.", ToastAndroid.SHORT);
                    } else {
                        setIsAuthenticated(true);
                    }
                } else {
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error("Error checking token:", error);
                setIsAuthenticated(false);
                await AsyncStorage.removeItem('token');
            }
            setLoading(false);
        };

        checkAuthToken();
    }, []);

    const login = async (token) => {
        await AsyncStorage.setItem('token', token);
        setIsAuthenticated(true);
    };

    const logout = async () => {
        await AsyncStorage.removeItem('token');
        setIsAuthenticated(false);
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Image 
                    style={{ width: "50%", height: "50%", resizeMode: "contain" }} 
                    source={require('../assets/Images/AAT-logo.png')} 
                />
            </View>
        );
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
