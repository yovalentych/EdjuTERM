import { View, Text, Pressable, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/constants/theme";
import { type LibraryItem } from "@/lib/mobile-store";
import { s } from "./styles";

export function LibraryModule({ items }: { items: LibraryItem[] }) {
  return (
    <View style={{ gap: 14 }}>
      <View style={s.moduleHeader}>
        <View style={[s.moduleIconWrap, { backgroundColor: "#1d4ed818" }]}>
          <Feather name="book-open" size={20} color="#1d4ed8" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.moduleTitle}>Бібліотека проєкту</Text>
          <Text style={s.moduleSub}>{items.length} джерел</Text>
        </View>
      </View>

      {items.length === 0 ? (
        <View style={s.emptyWrap}>
          <Feather name="book" size={30} color={colors.mutedSoft} />
          <Text style={s.emptyText}>Бібліотека порожня</Text>
        </View>
      ) : (
        items.map(item => (
          <View key={item._id} style={[s.wasteCard, { borderLeftColor: "#1d4ed8" }]}>
            <View style={s.wasteCardTop}>
              <View style={[s.wasteIconWrap, { backgroundColor: "#1d4ed818" }]}>
                <Feather name="book-open" size={16} color="#1d4ed8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.wasteName, { marginBottom: 2 }]}>{item.title}</Text>
                <Text style={s.wasteMeta}>{item.kind.replace("_", " ")}</Text>
              </View>
            </View>
            {item.doi && (
              <Pressable
                onPress={() => Alert.alert("DOI", item.doi || "")}
                style={[s.notifActionBtn, { backgroundColor: "white", borderWidth: 1, borderColor: "#1d4ed840", marginTop: 8 }]}
              >
                <Feather name="external-link" size={14} color="#1d4ed8" />
                <Text style={[s.notifActionBtnText, { color: "#1d4ed8" }]}>Відкрити DOI</Text>
              </Pressable>
            )}
          </View>
        ))
      )}
    </View>
  );
}
