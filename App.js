// @refresh reset
import { StatusBar } from "expo-status-bar";
import React, { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GiftedChat } from "react-native-gifted-chat";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  LogBox,
  Button,
} from "react-native";
import * as firebase from "firebase";
import "firebase/firestore";
import {
  AdMobBanner,
  AdMobInterstitial,
  PublisherBanner,
  AdMobRewarded,
  setTestDeviceIDAsync,
} from "expo-ads-admob";

const firebaseConfig = {
  apiKey: "AIzaSyCDxQcoxrCmQEUdjx2gl4MF5jndxuOC9q0",
  authDomain: "su-chat-ads.firebaseapp.com",
  projectId: "su-chat-ads",
  storageBucket: "su-chat-ads.appspot.com",
  messagingSenderId: "566630835433",
  appId: "1:566630835433:web:9f2a9ce7aed9baa919fc78",
};

if (firebase.apps.length === 0) {
  firebase.initializeApp(firebaseConfig);
}

LogBox.ignoreLogs(["Setting a timer"]);

const db = firebase.firestore();
const chatsRef = db.collection("chats");

export default function App() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    readUser();
    const unsubscribe = chatsRef.onSnapshot((querySnapshot) => {
      const messagesFirestore = querySnapshot
        .docChanges()
        .filter(({ type }) => type === "added")
        .map(({ doc }) => {
          const message = doc.data();
          return { ...message, createdAt: message.createdAt.toDate() };
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      appendMessages(messagesFirestore);
    });
  }, []);

  const appendMessages = useCallback(
    (messages) => {
      setMessages((previousMessages) =>
        GiftedChat.append(previousMessages, messages)
      );
    },
    [messages]
  );

  async function readUser() {
    const user = await AsyncStorage.getItem("user");
    if (user) {
      setUser(JSON.parse(user));
    }
  }

  async function handlePress() {
    AdMobInterstitial.setAdUnitID("ca-app-pub-9704818312708631/8872968068");
    AdMobInterstitial.requestAd().then(() => AdMobInterstitial.showAd());
    const _id = Math.random().toString(36).substring(7);
    const user = { _id, name };
    await AsyncStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  }

  async function handleSend(messages) {
    const writes = messages.map((m) => chatsRef.add(m));
    await Promise.all(writes);
  }
  if (!user) {
    return (
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
        />
        <Button onPress={handlePress} title="Enter the chat" />
        <Button onPress={showRewardAd} title="Show reward ad" />
      </View>
    );
  }

  async function showRewardAd() {
    AdMobRewarded.setAdUnitID("ca-app-pub-9704818312708631/8646216288");
    AdMobRewarded.requestAd().then(() => AdMobRewarded.showAd());
  }

  return (
    <>
      <GiftedChat messages={messages} user={user} onSend={handleSend} />
      <AdMobBanner
        bannerSize="fullBanner"
        adUnitID="ca-app-pub-9704818312708631/4526528942" // Test ID, Replace with your-admob-unit-id
        servePersonalizedAds // true or false
        onDidFailToReceiveAdWithError={this.bannerError}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  input: {
    height: 50,
    width: "100%",
    borderWidth: 1,
    padding: 15,
    marginBottom: 20,
    borderColor: "gray",
  },
});
