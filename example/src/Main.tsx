import { StackActions, useNavigation } from '@react-navigation/native'
import * as React from 'react'
import { Button, StyleSheet, Text, View } from 'react-native'

const Main = () => {
  const navigation = useNavigation()

  return (
    <View style={styles.container}>
      <Text>Unity Screen</Text>
      <Button
        title="Go to Unity"
        onPress={() => {
          const pushAction = StackActions.push('Unity', {})

          navigation.dispatch(pushAction)
        }}
      />
    </View>
  )
}

export default Main

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  }
})
