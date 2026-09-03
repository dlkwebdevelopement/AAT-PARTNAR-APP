import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    StatusBar,
    TouchableOpacity,
    Dimensions,
    Animated,
    ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../../utils/constants';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function BusRegisterComingSoon({ navigation }) {
    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(50));

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            {/* Background Accent */}
            <View style={styles.circleAccent} />
            
            <View style={styles.content}>
                {/* Back Button */}
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.deep_blue} />
                </TouchableOpacity>

                <Animated.View 
                    style={[
                        styles.mainContent, 
                        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                    ]}
                >
                    {/* Illustration / Icon */}
                    <View style={styles.illustrationContainer}>
                        <View style={styles.outerCircle}>
                            <View style={styles.innerCircle}>
                                <FontAwesome5 name="bus-alt" size={70} color={colors.deep_blue} />
                            </View>
                        </View>
                        {/* Sparkles */}
                        <Ionicons name="sparkles" size={30} color="#FFD700" style={styles.sparkle1} />
                        <Ionicons name="sparkles" size={20} color="#FFD700" style={styles.sparkle2} />
                    </View>

                    {/* Title & Badge */}
                    <View style={styles.headerGroup}>
                        <Text style={styles.title}>Bus Registration</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>COMING SOON</Text>
                        </View>
                    </View>

                    {/* Description */}
                    <View style={styles.card}>
                        <Text style={styles.description}>
                            We're preparing a complete ecosystem for Bus operators. From fleet management to real-time tracking, everything is on its way.
                        </Text>
                        
                        <View style={styles.divider} />
                        
                        <View style={styles.featureRow}>
                            <Ionicons name="shield-checkmark" size={20} color={colors.deep_blue} />
                            <Text style={styles.featureText}>Secure Fleet Management</Text>
                        </View>
                        <View style={styles.featureRow}>
                            <Ionicons name="trending-up" size={20} color={colors.deep_blue} />
                            <Text style={styles.featureText}>Optimized Route Earnings</Text>
                        </View>
                    </View>

                    {/* Footer Action */}
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()}
                        style={{ width: '60%', alignSelf: 'center' }}
                    >
                        <LinearGradient
                            colors={["#3B82F6", colors.deep_blue]}
                            style={styles.notifyBtn}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Ionicons name="arrow-back" size={20} color={colors.white} />
                            <Text style={[styles.notifyBtnText, { color: colors.white }]}>Go Back</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    
                    <Text style={styles.footerNote}>We'll notify you as soon as it's live!</Text>
                </Animated.View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    circleAccent: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: '#F0F4FF',
        opacity: 0.6,
    },
    content: {
        flex: 1,
        paddingHorizontal: 25,
    },
    backButton: {
        marginTop: 20,
        width: 45,
        height: 45,
        borderRadius: 23,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    mainContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 40,
    },
    illustrationContainer: {
        marginBottom: 30,
        position: 'relative',
    },
    outerCircle: {
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.deep_blue,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    innerCircle: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#F0F4FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sparkle1: {
        position: 'absolute',
        top: 0,
        right: -10,
    },
    sparkle2: {
        position: 'absolute',
        bottom: 20,
        left: -15,
    },
    headerGroup: {
        alignItems: 'center',
        marginBottom: 25,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: colors.deep_blue,
        marginBottom: 10,
    },
    badge: {
        backgroundColor: '#FEF3C7', // Light yellow background
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F59E0B',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#D97706', // Dark yellow text
        letterSpacing: 1,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 25,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 5,
        marginBottom: 30,
    },
    description: {
        fontSize: 16,
        color: '#4A4A4A',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 20,
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 15,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    featureText: {
        marginLeft: 12,
        fontSize: 14,
        color: colors.deep_blue,
        fontWeight: '600',
    },
    notifyBtn: {
        flexDirection: 'row',
        backgroundColor: colors.deep_blue,
        width: '60%',
        height: 55,
        borderRadius: 30,
        gap: 8,
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.deep_blue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    notifyBtnText: {
        color: colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    footerNote: {
        marginTop: 15,
        fontSize: 12,
        color: '#999',
    },
});