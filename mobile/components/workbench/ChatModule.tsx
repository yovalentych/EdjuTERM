import { View, Text, Pressable, TextInput, FlatList, KeyboardAvoidingView, Platform, RefreshControl } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useState, useRef } from "react";
import { type ChatMessage } from "@/lib/mobile-store";
import { s } from "./styles";

export function ChatModule({ messages, onSend, currentUser, onRefresh, loading }: {
  messages: ChatMessage[];
  onSend: (text: string) => Promise<void>;
  currentUser: any;
  onRefresh: () => void;
  loading: boolean;
}) {
  const [text, setText] = useState("");
  const listRef = useRef<FlatList>(null);

  const handleSend = async () => {
    if (!text.trim()) return;
    const msg = text; setText("");
    await onSend(msg);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, marginBottom: 20 }}>
      <View style={s.chatContainer}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item._id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          contentContainerStyle={{ paddingVertical: 10 }}
          renderItem={({ item }) => {
            const own = item.userId === currentUser?._id;
            return (
              <View style={[s.msgWrapper, own ? s.msgOwn : s.msgOther]}>
                <View style={[s.msgBubble, own ? s.bubbleOwn : s.bubbleOther]}>
                  <Text style={s.msgAuthor}>{item.displayName}</Text>
                  <Text style={[s.msgContent, own && { color: "white" }]}>{item.content}</Text>
                  <Text style={[s.msgTime, own && { color: "rgba(255,255,255,0.6)" }]}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
              </View>
            );
          }}
        />
        <View style={s.chatInputRow}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Повідомлення..."
            style={s.chatInput}
            multiline
          />
          <Pressable onPress={handleSend} style={s.sendBtn}>
            <Feather name="send" size={18} color="white" />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
