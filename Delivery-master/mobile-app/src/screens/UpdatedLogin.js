import React, { useState, useRef, useContext } from 'react'
import MaterialButtonDark from '../components/MaterialButtonDark'
import { TouchableOpacity, View, Text, StyleSheet, TextInput } from 'react-native'
import { language, countries, default_country_code } from 'config'
import { useSelector, useDispatch } from 'react-redux'
import { colors } from '../common/theme'
import { FirebaseContext } from 'common/src'
import firebase from 'firebase/app'
const UpdatedLogin = (props) => {
    const { setLoading,pageActive, navigation } = props
    const { api } = useContext(FirebaseContext)
    const {
        signIn,
        sendResetMail,
        clearLoginError,
        requestPhoneOtpDevice,
        mobileSignIn,
        checkUserExists
    } = api
    const formatCountries = () => {
        const arr = []
        for (let i = 0; i < countries.length; i++) {
            arr.push({ label: countries[i].label + ' (+' + countries[i].phone + ')', value: '+' + countries[i].phone, key: countries[i].code })
        }
        return arr
    }
    const [state, setState] = useState({
        email: '',
        password: '',
        customStyleIndex: 0,
        phoneNumber: null,
        verificationId: null,
        verificationCode: null,
        countryCodeList: formatCountries(),
        countryCode: "+" + default_country_code.phone
    });
    const dispatch = useDispatch()
    const emailInput = useRef(null)
    const passInput = useRef(null)
    const onAction = async () => {
        setLoading(true)
        const { email, password } = state
        if (validateEmail(email)) {
            if (password != '') {
                pageActive.current = true
                dispatch(signIn(email, password))
                setState({
                    ...state,
                    email: '',
                    password: ''
                })
                emailInput.current.focus()
            } else {
                passInput.current.focus()
                setLoading(false)
                Alert.alert(language.alert, language.password_blank_messege)
            }
        }
    }
    const signin = () => {
        const email = state.email
        const password = state.password
        firebase.auth().signInWithEmailAndPassword(email, password)
        .then(confirmResult => {
            console.log('confirmResult', confirmResult)
            navigation.navigate('RiderRoot')
          }).catch(function(error) {
           console.log(error.code);
           console.log(error.message);
        })
        }
    const Forgot_Password = async (email) => {
        if (validateEmail(email)) {
            Alert.alert(
                language.forgot_password_link,
                language.forgot_password_confirm,
                [
                    { text: language.cancel, onPress: () => { }, style: 'cancel' },
                    {
                        text: language.ok,
                        onPress: () => {
                            pageActive.current = true
                            dispatch(sendResetMail(email))
                        }
                    }
                ],
                { cancelable: true }
            )
        }
    }
    const validateEmail = (email) => {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        const emailValid = re.test(email)
        if (!emailValid) {
            emailInput.current.focus()
            setLoading(false)
            Alert.alert(language.alert, language.valid_email_check)
        }
        return emailValid
    }
    return (
        <View>
            <View style={styles.box1}>
                <TextInput
                    ref={emailInput}
                    style={styles.textInput}
                    placeholder={language.email_or_phone}
                    onChangeText={(value) => setState({ ...state, email: value })}
                    value={state.email}
                />
            </View>
            <View style={styles.box2}>
                <TextInput
                    ref={passInput}
                    style={styles.textInput}
                    placeholder={language.password_placeholder}
                    onChangeText={(value) => setState({ ...state, password: value })}
                    value={state.password}
                    secureTextEntry={true}
                />
            </View>
            <MaterialButtonDark
                onPress={signin}
                style={styles.materialButtonDark}>
                {language.login_button}
            </MaterialButtonDark>
            <View style={styles.linkBar}>
                <TouchableOpacity style={styles.barLinks} onPress={() => Forgot_Password(state.email)}>
                    <Text style={styles.linkText}>{language.forgot_password_link}</Text>
                </TouchableOpacity>
            </View>
        </View>
        // <Text>Hello</Text>
    )
}
export default UpdatedLogin
const styles = StyleSheet.create({
    materialButtonDark: {
        height: 40,
        marginTop: 22,
        marginLeft: 35,
        marginRight: 35,
        backgroundColor: colors.PINK,
        borderRadius: 15
    },

    linkBar: {
        flexDirection: "row",
        marginTop: 30,
        alignSelf: 'center'
    },
    barLinks: {
        marginLeft: 15,
        marginRight: 15,
        alignSelf: "center",
        fontSize: 18,
        fontWeight: 'bold'
    },
    linkText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.WHITE,
        fontFamily: "Roboto-Bold",
    },
    box1: {
        height: 45,
        backgroundColor: colors.WHITE,
        marginTop: 250,
        marginLeft: 35,
        marginRight: 35,
        borderWidth: 1.5,
        borderColor: colors.GREY.border,
        justifyContent: 'center',
        borderRadius: 15
    },
    box2: {
        height: 45,
        backgroundColor: colors.WHITE,
        marginTop: 20,
        marginLeft: 35,
        marginRight: 35,
        borderWidth: 1.5,
        borderColor: colors.GREY.border,
        justifyContent: 'center',
        borderRadius: 15
    },
    textInput: {
        backgroundColor: colors.WHITE.background,
        fontSize: 14,
        fontFamily: "Roboto-Regular",
        textAlign: "left",
        marginTop: 0,
        marginLeft: 5
    },
})

