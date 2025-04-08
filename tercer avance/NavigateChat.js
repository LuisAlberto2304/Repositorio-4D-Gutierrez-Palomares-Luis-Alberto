// En tu archivo de navegación (ej: AppNavigator.js)
import TicketChatScreen from "./components/TicketChatScreen";

const Stack = createNativeStackNavigator();

function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="WatchHistory" component={WatchHistoryScreen} />
      <Stack.Screen
        name="TicketChat"
        component={TicketChatScreen}
        options={({ route }) => ({
          title: `Ticket #${route.params.ticket.ticketId} Chat`,
        })}
      />
    </Stack.Navigator>
  );
}
