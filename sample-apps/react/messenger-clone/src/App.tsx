import { useMemo } from 'react';
import type {
  ChannelFilters,
  ChannelOptions,
  ChannelSort,
  UserResponse,
} from 'stream-chat';
import {
  Channel,
  ChannelList,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from 'stream-chat-react';
import { ChannelHeader } from './components/ChannelHeader';
import Video from './components/Video/Video';
import { CustomChannelSearch } from './components/CustomChannelSearch';
import { CustomEventComponent } from './components/CustomEventComponent';
import { Sidebar } from './components/Sidebar';
import { UserList } from './components/UserList';
import { useClient } from './hooks';
import { userFromToken } from './utils/userFromToken';

import type { StreamChatType } from './types/chat';

const apiKey = import.meta.env.VITE_STREAM_KEY as string;

const Root = () => {
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, property) => searchParams.get(property as string),
  }) as unknown as Record<string, string | null>;

  const userToken = params.ut ?? (import.meta.env.VITE_USER_TOKEN as string);

  const user = useMemo(() => userFromToken(userToken), [userToken]);

  if (!user?.id) return <UserList />;

  return <App user={user} userToken={userToken} />;
};

const App = ({
  user,
  userToken,
}: {
  user: UserResponse<StreamChatType>;
  userToken: string;
}) => {
  const client = useClient<StreamChatType>({
    apiKey,
    userData: user,
    tokenOrProvider: userToken,
  });

  const filters: ChannelFilters = {
    members: { $in: [user.id] },
    type: 'messaging',
  };
  const options: ChannelOptions = { limit: 10, presence: true, state: true };
  const sort: ChannelSort = { last_message_at: -1, updated_at: -1 };

  if (!client) return null;

  return (
    <Chat client={client}>
      <Video>
        <Sidebar>
          <ChannelList
            filters={filters}
            options={options}
            showChannelSearch
            sort={sort}
            ChannelSearch={CustomChannelSearch}
          />
        </Sidebar>
        <Channel MessageSystem={CustomEventComponent}>
          <Window>
            <ChannelHeader />
            <MessageList />
            <MessageInput focus />
          </Window>
          <Thread />
        </Channel>
      </Video>
    </Chat>
  );
};

export default Root;
