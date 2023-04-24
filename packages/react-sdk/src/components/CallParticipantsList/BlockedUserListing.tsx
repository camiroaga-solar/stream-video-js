import { OwnCapability } from '@stream-io/video-client';
import { useCall, useCallMetadata } from '@stream-io/video-react-bindings';

import { Restricted } from '../Moderation';
import { TextButton } from '../Button';

export const BlockedUserListing = () => {
  const callMetadata = useCallMetadata();

  const blockedUsers = callMetadata!.blocked_user_ids;

  if (!blockedUsers.length) return null;

  return (
    <>
      <div>Blocked users</div>
      <div className="str-video__participant-listing">
        {blockedUsers.map((userId) => (
          <BlockedUserListingItem key={userId} userId={userId} />
        ))}
      </div>
    </>
  );
};

const BlockedUserListingItem = ({ userId }: { userId: string }) => {
  const activeCall = useCall();

  const unblockUserClickHandler = () => {
    if (userId) activeCall?.unblockUser(userId);
  };

  return (
    <div className="str-video__participant-listing-item">
      <div className="str-video__participant-listing-item__display-name">
        {userId}
      </div>
      <Restricted requiredGrants={[OwnCapability.BLOCK_USERS]}>
        <TextButton onClick={unblockUserClickHandler}>Unblock</TextButton>
      </Restricted>
    </div>
  );
};
