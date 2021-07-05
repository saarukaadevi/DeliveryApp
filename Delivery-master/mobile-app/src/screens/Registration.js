import React, { useState, useEffect } from 'react'
import { Registration } from '../components'
import { StyleSheet, View, Alert } from 'react-native'
import { useSelector } from 'react-redux'
import { language } from 'config'
import { emailSignUp, validateReferer, checkUserExists } from 'common/src/actions/authactions'

export default function RegistrationPage (props) {
  const [loading, setLoading] = useState(false)
  const cars = useSelector(state => state.cartypes.cars)
  const [carTypes, setCarTypes] = useState(null)

  useEffect(() => {
    if (cars) {
      const arr = []
      for (let i = 0; i < cars.length; i++) {
        arr.push({ label: cars[i].name, value: cars[i].name })
      }
      setCarTypes(arr)
    }
  }, [cars])

  const clickRegister = async (regData) => {
    console.log('regData', regData)
    setLoading(true)
    checkUserExists(regData).then((res) => {
      console.log('Check user exist', res)
      if (res.users && res.users.length > 0) {
        setLoading(false)
        Alert.alert(language.alert, language.user_exists)
      } else if (res.error) {
        setLoading(false)
        Alert.alert(language.alert, language.email_or_mobile_issue)
      } else {
        console.log('In first else')
        if (regData.referralId && regData.referralId.length > 0) {
          console.log('regData.referralId', regData.referralId)
          validateReferer(regData.referralId).then((referralInfo) => {
            console.log('Referal info', referralInfo)
            if (referralInfo.uid) {
              emailSignUp({ ...regData, signupViaReferral: referralInfo.uid }).then((res) => {
                console.log('email signup response', res)
                setLoading(false)
                if (res.uid) {
                  Alert.alert(language.alert, language.account_create_successfully)
                  props.navigation.navigate('Login')
                } else {
                  Alert.alert(language.alert, language.reg_error)
                }
              })
            } else {
              setLoading(false)
              Alert.alert(language.alert, language.referer_not_found)
            }
          }).catch((error) => {
            console.log('Catch error', error)
            setLoading(false)
            Alert.alert(language.alert, language.referer_not_found)
          })
        } else {
          emailSignUp(regData).then((res) => {
            console.log('In function', res)
            setLoading(false)
            if (res.uid) {
              Alert.alert(language.alert, language.account_create_successfully)
              props.navigation.navigate('Login')
            } else {
              Alert.alert(language.alert, language.reg_error)
            }
          })
        }
      }
    })
  }

  return (
    <View style={styles.containerView}>
      {/* {carTypes? */}
      <Registration
        cars={carTypes}
        navigation={props.navigation}
        onPressRegister={(regData) => clickRegister(regData)}
        onPressBack={() => { props.navigation.goBack() }}
        setLoading={setLoading}
        loading={loading}
      />
      {/* :null} */}
    </View>
  )
}
const styles = StyleSheet.create({
  containerView: { flex: 1 },
  textContainer: { textAlign: 'center' }
})
