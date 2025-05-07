// __tests__/gcd-test.tsx
import React from "react";
import { render, fireEvent, act, waitFor } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { Alert } from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as expoRouter from "expo-router";
import {
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
} from "firebase/firestore";

import GroupChatDetail from "../app/GroupChatDetail";

// ---- mocks ----
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

jest.mock("../_utlis/firebaseConfig", () => ({
  app: {},
  firestore: {},
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  setDoc: jest.fn(),
  getDocs: jest.fn(),
  arrayUnion: jest.fn(),
  arrayRemove: jest.fn(),
  increment: jest.fn(),
  deleteField: jest.fn(),
  serverTimestamp: jest.fn(),
  onSnapshot: jest.fn(),
}));

// ---- test helpers ----
const renderWithNavigation = (ui: React.ReactElement) =>
  render(<NavigationContainer>{ui}</NavigationContainer>);

// We'll capture exactly two onSnapshot listeners:
const snapshotHandlers: {
  typing?: jest.Mock;
  messages?: jest.Mock;
} = {};

describe("GroupChatDetail", () => {
  const groupId = "test-group-id";
  const currentUserId = "1";
  const currentUserName = "Alice";
  let routerBack: jest.Mock, routerPush: jest.Mock, routerReplace: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // 1) local params: include one dummy friend so add-member shows up
    (expoRouter.useLocalSearchParams as jest.Mock).mockReturnValue({
      groupId,
      groupName: "Test Group",
      groupImage: "",
      friends: JSON.stringify([
        { id: "2", username: "Bob" }, // this one is addable
      ]),
    });

    // 2) routing
    routerBack = jest.fn();
    routerPush = jest.fn();
    routerReplace = jest.fn();
    (expoRouter.useRouter as jest.Mock).mockReturnValue({
      back: routerBack,
      push: routerPush,
      replace: routerReplace,
    });

    // 3) AsyncStorage userInfo
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === "userInfo") {
        return Promise.resolve(
          JSON.stringify({ id: currentUserId, username: currentUserName })
        );
      }
      return Promise.resolve(null);
    });

    // 4) onSnapshot: first → typingStatus, second → latest message
    let callCount = 0;
    (onSnapshot as jest.Mock).mockImplementation((_, cb: jest.Mock) => {
      callCount++;
      if (callCount === 1) {
        snapshotHandlers.typing = cb;
        cb({ docs: [] });
      } else if (callCount === 2) {
        snapshotHandlers.messages = cb;
        cb({ docs: [] });
      }
      return jest.fn(); // unsubscribe
    });

    // 5) getDocs chain for fetchMembers():
    //   - first getDocs → members subcollection → empty
    //   - second getDocs → groupChats root → we set adminId = me
    //   - all further getDocs → empty
    (getDocs as jest.Mock)
      .mockImplementationOnce(() =>
        Promise.resolve({
          docs: [], // no members in subcollection
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          docs: [
            {
              id: groupId,
              data: () => ({ adminId: 1 }), // Ensures match
            },
          ],
        })
      )
      .mockImplementation(() =>
        Promise.resolve({
          docs: [],
        })
      );

    // 6) Firestore writes
    (addDoc as jest.Mock).mockResolvedValue({ id: "mock-id" });
    (updateDoc as jest.Mock).mockResolvedValue({});
    (deleteDoc as jest.Mock).mockResolvedValue({});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the header, message list, input box, and sidebar toggle", () => {
    const { getByTestId, queryByText, getByText } = renderWithNavigation(
      <GroupChatDetail />
    );

    // header from useLocalSearchParams → ribbonGroupName
    expect(getByTestId("group-name").props.children).toBe("Test Group");

    // no initial message
    expect(queryByText("Hello")).toBeNull();

    // fire a single message into the 2nd onSnapshot
    act(() => {
      snapshotHandlers.messages!({
        docs: [
          {
            id: "m1",
            data: () => ({
              content: "Hello",
              senderId: Number(currentUserId),
              system: false,
              timestamp: { toMillis: () => Date.now() },
            }),
          },
        ],
      });
    });

    expect(getByText("Hello")).toBeTruthy();

    // input & send
    expect(getByTestId("messageInput")).toBeTruthy();
    expect(getByTestId("sendButton")).toBeTruthy();

    // the avatar/info button is the only sidebarToggle initially
    expect(getByTestId("sidebarToggle")).toBeTruthy();
    expect(() => getByTestId("sidebar")).toThrow();
  });

  it("sends a message and clears the input field", async () => {
    const { getByTestId } = renderWithNavigation(<GroupChatDetail />);

    // wait for useEffect → currentUserId & members
    await act(async () => {});

    // no messages yet
    act(() => {
      snapshotHandlers.messages!({ docs: [] });
    });

    const input = getByTestId("messageInput");
    const sendBtn = getByTestId("sendButton");

    // empty → no-op
    fireEvent.press(sendBtn);
    expect(addDoc).not.toHaveBeenCalled();

    // type + send
    fireEvent.changeText(input, "Test message");
    await act(async () => fireEvent.press(sendBtn));

    // should have written
    expect(addDoc).toHaveBeenCalledTimes(1);
    const [, payload] = (addDoc as jest.Mock).mock.calls[0];
    expect(payload.content).toBe("Test message");
    expect(payload.senderId).toBe(Number(currentUserId));

    // input cleared
    expect(getByTestId("messageInput").props.value).toBe("");

    // new message arrives
    act(() => {
      snapshotHandlers.messages!({
        docs: [
          {
            id: "m2",
            data: () => ({
              content: "Test message",
              senderId: Number(currentUserId),
              system: false,
              timestamp: { toMillis: () => Date.now() },
            }),
          },
        ],
      });
    });
    expect(getByTestId("messageInput")).toBeTruthy();
  });

  
  
  
  
  

  it("toggles the sidebar when you press the info button", () => {
    const { getAllByTestId } = renderWithNavigation(<GroupChatDetail />);

    // initially just the header toggle
    expect(getAllByTestId("sidebarToggle")).toHaveLength(1);

    // open
    fireEvent.press(getAllByTestId("sidebarToggle")[0]);
    expect(getAllByTestId("sidebarToggle")).toHaveLength(2);

    // close
    fireEvent.press(getAllByTestId("sidebarToggle")[0]);
    expect(getAllByTestId("sidebarToggle")).toHaveLength(1);
  });

  it('allows adding a new group member via the "+ Add Members" text', async () => {
    const { getByText, getByTestId, getAllByTestId } = renderWithNavigation(<GroupChatDetail />);
  
    await act(async () => {}); // Let useEffect finish
  
    fireEvent.press(getAllByTestId("sidebarToggle")[0]);
    fireEvent.press(getByText("+ Add Members"));
  
    await act(async () => {
      const btn = getByTestId("addMemberButton");
      fireEvent.press(btn);
    });
  
    expect(updateDoc).toHaveBeenCalled();
    expect(addDoc).toHaveBeenCalled();
  });
  

  it("renders system messages in the chat history", () => {
    const { getByText } = renderWithNavigation(<GroupChatDetail />);

    act(() => {
      snapshotHandlers.messages!({
        docs: [
          {
            id: "sys1",
            data: () => ({
              content: "Alice left the group",
              system: true,
              timestamp: { toMillis: () => Date.now() },
            }),
          },
          {
            id: "m3",
            data: () => ({
              content: "Hi there",
              senderId: Number(currentUserId),
              system: false,
              timestamp: { toMillis: () => Date.now() },
            }),
          },
        ],
      });
    });

    expect(getByText("Alice left the group")).toBeTruthy();
    expect(getByText("Hi there")).toBeTruthy();
  }); 
});
