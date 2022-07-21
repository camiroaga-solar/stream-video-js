/* eslint-disable */
// @generated by protobuf-ts 2.7.0 with parameter long_type_string,generate_dependencies,client_generic,server_none,eslint_disable
// @generated from protobuf file "video_coordinator_rpc/coordinator_service.proto" (package "stream.video", syntax proto3)
// tslint:disable
import type { RpcTransport } from "@protobuf-ts/runtime-rpc";
import type { ServiceInfo } from "@protobuf-ts/runtime-rpc";
import { CallCoordinatorService } from "./coordinator_service";
import type { GetRecordingsResponse } from "./coordinator_service";
import type { GetRecordingsRequest } from "./coordinator_service";
import type { StopRecordingResponse } from "./coordinator_service";
import type { StopRecordingRequest } from "./coordinator_service";
import type { StartRecordingResponse } from "./coordinator_service";
import type { StartRecordingRequest } from "./coordinator_service";
import type { ExportUserResponse } from "./coordinator_service";
import type { ExportUserRequest } from "./coordinator_service";
import type { DeleteUserResponse } from "./coordinator_service";
import type { DeleteUserRequest } from "./coordinator_service";
import type { CreateUserResponse } from "./coordinator_service";
import type { CreateUserRequest } from "./coordinator_service";
import type { StopBroadcastRequest } from "./coordinator_service";
import type { StartBroadcastResponse } from "./coordinator_service";
import type { StartBroadcastRequest } from "./coordinator_service";
import type { StopTranscribeCallResponse } from "./coordinator_service";
import type { StopTranscribeCallRequest } from "./coordinator_service";
import type { TranscribeCallResponse } from "./coordinator_service";
import type { TranscribeCallRequest } from "./coordinator_service";
import type { CreateOrUpdateUsersResponse } from "./coordinator_service";
import type { CreateOrUpdateUsersRequest } from "./coordinator_service";
import type { CreateOrUpdateCallsResponse } from "./coordinator_service";
import type { CreateOrUpdateCallsRequest } from "./coordinator_service";
import type { SendCustomEventResponse } from "./coordinator_service";
import type { SendCustomEventRequest } from "./coordinator_service";
import type { ListDevicesResponse } from "./coordinator_service";
import type { ListDevicesRequest } from "./coordinator_service";
import type { RemoveDeviceResponse } from "./coordinator_service";
import type { RemoveDeviceRequest } from "./coordinator_service";
import type { AddDeviceResponse } from "./coordinator_service";
import type { AddDeviceRequest } from "./coordinator_service";
import type { EndCallResponse } from "./coordinator_service";
import type { EndCallRequest } from "./coordinator_service";
import type { LeaveCallResponse } from "./coordinator_service";
import type { LeaveCallRequest } from "./coordinator_service";
import type { SelectEdgeServerResponse } from "./coordinator_service";
import type { SelectEdgeServerRequest } from "./coordinator_service";
import type { JoinCallResponse } from "./coordinator_service";
import type { JoinCallRequest } from "./coordinator_service";
import type { DeleteCallResponse } from "./coordinator_service";
import type { DeleteCallRequest } from "./coordinator_service";
import type { UpdateCallResponse } from "./coordinator_service";
import type { UpdateCallRequest } from "./coordinator_service";
import type { GetCallResponse } from "./coordinator_service";
import type { GetCallRequest } from "./coordinator_service";
import { stackIntercept } from "@protobuf-ts/runtime-rpc";
import type { CreateCallResponse } from "./coordinator_service";
import type { CreateCallRequest } from "./coordinator_service";
import type { UnaryCall } from "@protobuf-ts/runtime-rpc";
import type { RpcOptions } from "@protobuf-ts/runtime-rpc";
/**
 * @generated from protobuf service stream.video.CallCoordinatorService
 */
export interface ICallCoordinatorServiceClient {
    /**
     * CreateCall creates a new call that is unique for the combination of type and id fields
     * If a call with the same type and id already exists then the call will be updated based on the request (if allowed and if needed)
     * The user calling this endpoint will be created if necessary ({id: id})
     * The users listed in the participants field will also be created if necessary ({id: id})
     *
     * @generated from protobuf rpc: CreateCall(stream.video.CreateCallRequest) returns (stream.video.CreateCallResponse);
     */
    createCall(input: CreateCallRequest, options?: RpcOptions): UnaryCall<CreateCallRequest, CreateCallResponse>;
    /**
     * GetCall retrieves the state for one call, the user calling this endpoint is created if missing
     *
     * @generated from protobuf rpc: GetCall(stream.video.GetCallRequest) returns (stream.video.GetCallResponse);
     */
    getCall(input: GetCallRequest, options?: RpcOptions): UnaryCall<GetCallRequest, GetCallResponse>;
    /**
     * @generated from protobuf rpc: UpdateCall(stream.video.UpdateCallRequest) returns (stream.video.UpdateCallResponse);
     */
    updateCall(input: UpdateCallRequest, options?: RpcOptions): UnaryCall<UpdateCallRequest, UpdateCallResponse>;
    /**
     * @generated from protobuf rpc: DeleteCall(stream.video.DeleteCallRequest) returns (stream.video.DeleteCallResponse);
     */
    deleteCall(input: DeleteCallRequest, options?: RpcOptions): UnaryCall<DeleteCallRequest, DeleteCallResponse>;
    /**
     * JoinCall returns the call state and the list of edges that the user should be check for latency
     * this endpoint is meant to be used to prepare the information needed to call the SelectEdgeServer endpoint
     *
     * @generated from protobuf rpc: JoinCall(stream.video.JoinCallRequest) returns (stream.video.JoinCallResponse);
     */
    joinCall(input: JoinCallRequest, options?: RpcOptions): UnaryCall<JoinCallRequest, JoinCallResponse>;
    /**
     * @generated from protobuf rpc: SelectEdgeServer(stream.video.SelectEdgeServerRequest) returns (stream.video.SelectEdgeServerResponse);
     */
    selectEdgeServer(input: SelectEdgeServerRequest, options?: RpcOptions): UnaryCall<SelectEdgeServerRequest, SelectEdgeServerResponse>;
    /**
     * @generated from protobuf rpc: LeaveCall(stream.video.LeaveCallRequest) returns (stream.video.LeaveCallResponse);
     */
    leaveCall(input: LeaveCallRequest, options?: RpcOptions): UnaryCall<LeaveCallRequest, LeaveCallResponse>;
    /**
     * @generated from protobuf rpc: EndCall(stream.video.EndCallRequest) returns (stream.video.EndCallResponse);
     */
    endCall(input: EndCallRequest, options?: RpcOptions): UnaryCall<EndCallRequest, EndCallResponse>;
    /**
     * AddDevice registers the mobile device for push notifications
     * this endpoint will create the user if missing
     * if a device with the same id and push_provider_name exists, then the operation will be ignored
     *
     * @generated from protobuf rpc: AddDevice(stream.video.AddDeviceRequest) returns (stream.video.AddDeviceResponse);
     */
    addDevice(input: AddDeviceRequest, options?: RpcOptions): UnaryCall<AddDeviceRequest, AddDeviceResponse>;
    /**
     * @generated from protobuf rpc: RemoveDevice(stream.video.RemoveDeviceRequest) returns (stream.video.RemoveDeviceResponse);
     */
    removeDevice(input: RemoveDeviceRequest, options?: RpcOptions): UnaryCall<RemoveDeviceRequest, RemoveDeviceResponse>;
    /**
     * @generated from protobuf rpc: ListDevices(stream.video.ListDevicesRequest) returns (stream.video.ListDevicesResponse);
     */
    listDevices(input: ListDevicesRequest, options?: RpcOptions): UnaryCall<ListDevicesRequest, ListDevicesResponse>;
    /**
     * add reaction should perhaps just be handled by chat
     *
     * @generated from protobuf rpc: SendCustomEvent(stream.video.SendCustomEventRequest) returns (stream.video.SendCustomEventResponse);
     */
    sendCustomEvent(input: SendCustomEventRequest, options?: RpcOptions): UnaryCall<SendCustomEventRequest, SendCustomEventResponse>;
    // room is a confusing name. better to call it breakout room
    // breakout rooms have their own audio/video track
    // breakout rooms have their own chat

    // *
    // TODO
    // rpc CreateBreakoutRoom(CreateBreakoutRoomRequest) returns (CreateBreakoutRoomResponse);
    // rpc JoinBreakoutRoom() returns ();
    // rpc LeaveBreakoutRoom() returns ();
    // rpc DeleteBreakoutRoom() returns ();

    /**
     * server side sync & advanced endpoints
     *
     * @generated from protobuf rpc: CreateOrUpdateCalls(stream.video.CreateOrUpdateCallsRequest) returns (stream.video.CreateOrUpdateCallsResponse);
     */
    createOrUpdateCalls(input: CreateOrUpdateCallsRequest, options?: RpcOptions): UnaryCall<CreateOrUpdateCallsRequest, CreateOrUpdateCallsResponse>;
    /**
     * @generated from protobuf rpc: CreateOrUpdateUsers(stream.video.CreateOrUpdateUsersRequest) returns (stream.video.CreateOrUpdateUsersResponse);
     */
    createOrUpdateUsers(input: CreateOrUpdateUsersRequest, options?: RpcOptions): UnaryCall<CreateOrUpdateUsersRequest, CreateOrUpdateUsersResponse>;
    /**
     * recording a call or transcribing a call can be
     * A. Enabled by default for a call type
     * B. Enabled when creating the call per the default call type settings
     * C. Configured differently for that specific call
     * D. Enabled during the call
     *
     * @generated from protobuf rpc: TranscribeCall(stream.video.TranscribeCallRequest) returns (stream.video.TranscribeCallResponse);
     */
    transcribeCall(input: TranscribeCallRequest, options?: RpcOptions): UnaryCall<TranscribeCallRequest, TranscribeCallResponse>;
    /**
     * @generated from protobuf rpc: StopTranscribeCall(stream.video.StopTranscribeCallRequest) returns (stream.video.StopTranscribeCallResponse);
     */
    stopTranscribeCall(input: StopTranscribeCallRequest, options?: RpcOptions): UnaryCall<StopTranscribeCallRequest, StopTranscribeCallResponse>;
    /**
     * start broadcast/ stop broadcast to HLS, RTMP and storage
     *
     * @generated from protobuf rpc: StartBroadcast(stream.video.StartBroadcastRequest) returns (stream.video.StartBroadcastResponse);
     */
    startBroadcast(input: StartBroadcastRequest, options?: RpcOptions): UnaryCall<StartBroadcastRequest, StartBroadcastResponse>;
    /**
     * @generated from protobuf rpc: StopBroadcast(stream.video.StopBroadcastRequest) returns (stream.video.StartBroadcastResponse);
     */
    stopBroadcast(input: StopBroadcastRequest, options?: RpcOptions): UnaryCall<StopBroadcastRequest, StartBroadcastResponse>;
    /**
     * User & GDPR endpoints, delete user
     *
     * @generated from protobuf rpc: CreateUser(stream.video.CreateUserRequest) returns (stream.video.CreateUserResponse);
     */
    createUser(input: CreateUserRequest, options?: RpcOptions): UnaryCall<CreateUserRequest, CreateUserResponse>;
    /**
     * @generated from protobuf rpc: DeleteUser(stream.video.DeleteUserRequest) returns (stream.video.DeleteUserResponse);
     */
    deleteUser(input: DeleteUserRequest, options?: RpcOptions): UnaryCall<DeleteUserRequest, DeleteUserResponse>;
    /**
     * This requires having some sort of user/team level concept
     *
     * @generated from protobuf rpc: ExportUser(stream.video.ExportUserRequest) returns (stream.video.ExportUserResponse);
     */
    exportUser(input: ExportUserRequest, options?: RpcOptions): UnaryCall<ExportUserRequest, ExportUserResponse>;
    /**
     * call recording endpoints
     *
     * @generated from protobuf rpc: StartRecording(stream.video.StartRecordingRequest) returns (stream.video.StartRecordingResponse);
     */
    startRecording(input: StartRecordingRequest, options?: RpcOptions): UnaryCall<StartRecordingRequest, StartRecordingResponse>;
    /**
     * @generated from protobuf rpc: StopRecording(stream.video.StopRecordingRequest) returns (stream.video.StopRecordingResponse);
     */
    stopRecording(input: StopRecordingRequest, options?: RpcOptions): UnaryCall<StopRecordingRequest, StopRecordingResponse>;
    /**
     * @generated from protobuf rpc: GetRecordings(stream.video.GetRecordingsRequest) returns (stream.video.GetRecordingsResponse);
     */
    getRecordings(input: GetRecordingsRequest, options?: RpcOptions): UnaryCall<GetRecordingsRequest, GetRecordingsResponse>;
}
/**
 * @generated from protobuf service stream.video.CallCoordinatorService
 */
export class CallCoordinatorServiceClient implements ICallCoordinatorServiceClient, ServiceInfo {
    typeName = CallCoordinatorService.typeName;
    methods = CallCoordinatorService.methods;
    options = CallCoordinatorService.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * CreateCall creates a new call that is unique for the combination of type and id fields
     * If a call with the same type and id already exists then the call will be updated based on the request (if allowed and if needed)
     * The user calling this endpoint will be created if necessary ({id: id})
     * The users listed in the participants field will also be created if necessary ({id: id})
     *
     * @generated from protobuf rpc: CreateCall(stream.video.CreateCallRequest) returns (stream.video.CreateCallResponse);
     */
    createCall(input: CreateCallRequest, options?: RpcOptions): UnaryCall<CreateCallRequest, CreateCallResponse> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<CreateCallRequest, CreateCallResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * GetCall retrieves the state for one call, the user calling this endpoint is created if missing
     *
     * @generated from protobuf rpc: GetCall(stream.video.GetCallRequest) returns (stream.video.GetCallResponse);
     */
    getCall(input: GetCallRequest, options?: RpcOptions): UnaryCall<GetCallRequest, GetCallResponse> {
        const method = this.methods[1], opt = this._transport.mergeOptions(options);
        return stackIntercept<GetCallRequest, GetCallResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: UpdateCall(stream.video.UpdateCallRequest) returns (stream.video.UpdateCallResponse);
     */
    updateCall(input: UpdateCallRequest, options?: RpcOptions): UnaryCall<UpdateCallRequest, UpdateCallResponse> {
        const method = this.methods[2], opt = this._transport.mergeOptions(options);
        return stackIntercept<UpdateCallRequest, UpdateCallResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: DeleteCall(stream.video.DeleteCallRequest) returns (stream.video.DeleteCallResponse);
     */
    deleteCall(input: DeleteCallRequest, options?: RpcOptions): UnaryCall<DeleteCallRequest, DeleteCallResponse> {
        const method = this.methods[3], opt = this._transport.mergeOptions(options);
        return stackIntercept<DeleteCallRequest, DeleteCallResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * JoinCall returns the call state and the list of edges that the user should be check for latency
     * this endpoint is meant to be used to prepare the information needed to call the SelectEdgeServer endpoint
     *
     * @generated from protobuf rpc: JoinCall(stream.video.JoinCallRequest) returns (stream.video.JoinCallResponse);
     */
    joinCall(input: JoinCallRequest, options?: RpcOptions): UnaryCall<JoinCallRequest, JoinCallResponse> {
        const method = this.methods[4], opt = this._transport.mergeOptions(options);
        return stackIntercept<JoinCallRequest, JoinCallResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: SelectEdgeServer(stream.video.SelectEdgeServerRequest) returns (stream.video.SelectEdgeServerResponse);
     */
    selectEdgeServer(input: SelectEdgeServerRequest, options?: RpcOptions): UnaryCall<SelectEdgeServerRequest, SelectEdgeServerResponse> {
        const method = this.methods[5], opt = this._transport.mergeOptions(options);
        return stackIntercept<SelectEdgeServerRequest, SelectEdgeServerResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: LeaveCall(stream.video.LeaveCallRequest) returns (stream.video.LeaveCallResponse);
     */
    leaveCall(input: LeaveCallRequest, options?: RpcOptions): UnaryCall<LeaveCallRequest, LeaveCallResponse> {
        const method = this.methods[6], opt = this._transport.mergeOptions(options);
        return stackIntercept<LeaveCallRequest, LeaveCallResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: EndCall(stream.video.EndCallRequest) returns (stream.video.EndCallResponse);
     */
    endCall(input: EndCallRequest, options?: RpcOptions): UnaryCall<EndCallRequest, EndCallResponse> {
        const method = this.methods[7], opt = this._transport.mergeOptions(options);
        return stackIntercept<EndCallRequest, EndCallResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * AddDevice registers the mobile device for push notifications
     * this endpoint will create the user if missing
     * if a device with the same id and push_provider_name exists, then the operation will be ignored
     *
     * @generated from protobuf rpc: AddDevice(stream.video.AddDeviceRequest) returns (stream.video.AddDeviceResponse);
     */
    addDevice(input: AddDeviceRequest, options?: RpcOptions): UnaryCall<AddDeviceRequest, AddDeviceResponse> {
        const method = this.methods[8], opt = this._transport.mergeOptions(options);
        return stackIntercept<AddDeviceRequest, AddDeviceResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: RemoveDevice(stream.video.RemoveDeviceRequest) returns (stream.video.RemoveDeviceResponse);
     */
    removeDevice(input: RemoveDeviceRequest, options?: RpcOptions): UnaryCall<RemoveDeviceRequest, RemoveDeviceResponse> {
        const method = this.methods[9], opt = this._transport.mergeOptions(options);
        return stackIntercept<RemoveDeviceRequest, RemoveDeviceResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: ListDevices(stream.video.ListDevicesRequest) returns (stream.video.ListDevicesResponse);
     */
    listDevices(input: ListDevicesRequest, options?: RpcOptions): UnaryCall<ListDevicesRequest, ListDevicesResponse> {
        const method = this.methods[10], opt = this._transport.mergeOptions(options);
        return stackIntercept<ListDevicesRequest, ListDevicesResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * add reaction should perhaps just be handled by chat
     *
     * @generated from protobuf rpc: SendCustomEvent(stream.video.SendCustomEventRequest) returns (stream.video.SendCustomEventResponse);
     */
    sendCustomEvent(input: SendCustomEventRequest, options?: RpcOptions): UnaryCall<SendCustomEventRequest, SendCustomEventResponse> {
        const method = this.methods[11], opt = this._transport.mergeOptions(options);
        return stackIntercept<SendCustomEventRequest, SendCustomEventResponse>("unary", this._transport, method, opt, input);
    }
    // room is a confusing name. better to call it breakout room
    // breakout rooms have their own audio/video track
    // breakout rooms have their own chat

    // *
    // TODO
    // rpc CreateBreakoutRoom(CreateBreakoutRoomRequest) returns (CreateBreakoutRoomResponse);
    // rpc JoinBreakoutRoom() returns ();
    // rpc LeaveBreakoutRoom() returns ();
    // rpc DeleteBreakoutRoom() returns ();

    /**
     * server side sync & advanced endpoints
     *
     * @generated from protobuf rpc: CreateOrUpdateCalls(stream.video.CreateOrUpdateCallsRequest) returns (stream.video.CreateOrUpdateCallsResponse);
     */
    createOrUpdateCalls(input: CreateOrUpdateCallsRequest, options?: RpcOptions): UnaryCall<CreateOrUpdateCallsRequest, CreateOrUpdateCallsResponse> {
        const method = this.methods[12], opt = this._transport.mergeOptions(options);
        return stackIntercept<CreateOrUpdateCallsRequest, CreateOrUpdateCallsResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: CreateOrUpdateUsers(stream.video.CreateOrUpdateUsersRequest) returns (stream.video.CreateOrUpdateUsersResponse);
     */
    createOrUpdateUsers(input: CreateOrUpdateUsersRequest, options?: RpcOptions): UnaryCall<CreateOrUpdateUsersRequest, CreateOrUpdateUsersResponse> {
        const method = this.methods[13], opt = this._transport.mergeOptions(options);
        return stackIntercept<CreateOrUpdateUsersRequest, CreateOrUpdateUsersResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * recording a call or transcribing a call can be
     * A. Enabled by default for a call type
     * B. Enabled when creating the call per the default call type settings
     * C. Configured differently for that specific call
     * D. Enabled during the call
     *
     * @generated from protobuf rpc: TranscribeCall(stream.video.TranscribeCallRequest) returns (stream.video.TranscribeCallResponse);
     */
    transcribeCall(input: TranscribeCallRequest, options?: RpcOptions): UnaryCall<TranscribeCallRequest, TranscribeCallResponse> {
        const method = this.methods[14], opt = this._transport.mergeOptions(options);
        return stackIntercept<TranscribeCallRequest, TranscribeCallResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: StopTranscribeCall(stream.video.StopTranscribeCallRequest) returns (stream.video.StopTranscribeCallResponse);
     */
    stopTranscribeCall(input: StopTranscribeCallRequest, options?: RpcOptions): UnaryCall<StopTranscribeCallRequest, StopTranscribeCallResponse> {
        const method = this.methods[15], opt = this._transport.mergeOptions(options);
        return stackIntercept<StopTranscribeCallRequest, StopTranscribeCallResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * start broadcast/ stop broadcast to HLS, RTMP and storage
     *
     * @generated from protobuf rpc: StartBroadcast(stream.video.StartBroadcastRequest) returns (stream.video.StartBroadcastResponse);
     */
    startBroadcast(input: StartBroadcastRequest, options?: RpcOptions): UnaryCall<StartBroadcastRequest, StartBroadcastResponse> {
        const method = this.methods[16], opt = this._transport.mergeOptions(options);
        return stackIntercept<StartBroadcastRequest, StartBroadcastResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: StopBroadcast(stream.video.StopBroadcastRequest) returns (stream.video.StartBroadcastResponse);
     */
    stopBroadcast(input: StopBroadcastRequest, options?: RpcOptions): UnaryCall<StopBroadcastRequest, StartBroadcastResponse> {
        const method = this.methods[17], opt = this._transport.mergeOptions(options);
        return stackIntercept<StopBroadcastRequest, StartBroadcastResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * User & GDPR endpoints, delete user
     *
     * @generated from protobuf rpc: CreateUser(stream.video.CreateUserRequest) returns (stream.video.CreateUserResponse);
     */
    createUser(input: CreateUserRequest, options?: RpcOptions): UnaryCall<CreateUserRequest, CreateUserResponse> {
        const method = this.methods[18], opt = this._transport.mergeOptions(options);
        return stackIntercept<CreateUserRequest, CreateUserResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: DeleteUser(stream.video.DeleteUserRequest) returns (stream.video.DeleteUserResponse);
     */
    deleteUser(input: DeleteUserRequest, options?: RpcOptions): UnaryCall<DeleteUserRequest, DeleteUserResponse> {
        const method = this.methods[19], opt = this._transport.mergeOptions(options);
        return stackIntercept<DeleteUserRequest, DeleteUserResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * This requires having some sort of user/team level concept
     *
     * @generated from protobuf rpc: ExportUser(stream.video.ExportUserRequest) returns (stream.video.ExportUserResponse);
     */
    exportUser(input: ExportUserRequest, options?: RpcOptions): UnaryCall<ExportUserRequest, ExportUserResponse> {
        const method = this.methods[20], opt = this._transport.mergeOptions(options);
        return stackIntercept<ExportUserRequest, ExportUserResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * call recording endpoints
     *
     * @generated from protobuf rpc: StartRecording(stream.video.StartRecordingRequest) returns (stream.video.StartRecordingResponse);
     */
    startRecording(input: StartRecordingRequest, options?: RpcOptions): UnaryCall<StartRecordingRequest, StartRecordingResponse> {
        const method = this.methods[21], opt = this._transport.mergeOptions(options);
        return stackIntercept<StartRecordingRequest, StartRecordingResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: StopRecording(stream.video.StopRecordingRequest) returns (stream.video.StopRecordingResponse);
     */
    stopRecording(input: StopRecordingRequest, options?: RpcOptions): UnaryCall<StopRecordingRequest, StopRecordingResponse> {
        const method = this.methods[22], opt = this._transport.mergeOptions(options);
        return stackIntercept<StopRecordingRequest, StopRecordingResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: GetRecordings(stream.video.GetRecordingsRequest) returns (stream.video.GetRecordingsResponse);
     */
    getRecordings(input: GetRecordingsRequest, options?: RpcOptions): UnaryCall<GetRecordingsRequest, GetRecordingsResponse> {
        const method = this.methods[23], opt = this._transport.mergeOptions(options);
        return stackIntercept<GetRecordingsRequest, GetRecordingsResponse>("unary", this._transport, method, opt, input);
    }
}
