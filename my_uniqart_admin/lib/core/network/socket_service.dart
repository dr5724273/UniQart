import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../constants/api_constants.dart';
import '../../domain/entities/admin_notification_entity.dart';

class SocketService {
  io.Socket? _socket;
  final StreamController<AdminNotificationEntity> _notificationController =
      StreamController<AdminNotificationEntity>.broadcast();

  Stream<AdminNotificationEntity> get notificationStream => _notificationController.stream;

  void connect(String token) {
    disconnect();

    final formattedToken = token.startsWith('Bearer ') ? token : 'Bearer $token';
    debugPrint('Connecting to Socket.IO at ${ApiConstants.socketUrl}...');

    _socket = io.io(
      ApiConstants.socketUrl,
      io.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .setAuth({'token': formattedToken})
          .setExtraHeaders({'Authorization': formattedToken})
          .disableAutoConnect()
          .enableReconnection()
          .setReconnectionAttempts(99999)
          .setReconnectionDelay(2000)
          .build(),
    );

    _socket?.onConnect((_) {
      debugPrint('Socket connected! Emitting authenticate event...');
      _socket?.emit('authenticate', {'token': formattedToken});
    });

    _socket?.on('authenticated', (data) {
      debugPrint('Socket authenticated successfully and joined admin room: $data');
    });

    _socket?.onConnectError((err) => debugPrint('Socket connect error: $err'));
    _socket?.onError((err) => debugPrint('Socket error: $err'));
    _socket?.onDisconnect((_) => debugPrint('Socket disconnected. Auto-reconnection enabled.'));

    _socket?.on('admin_notification', (data) {
      debugPrint('Socket received admin_notification event: $data');
      if (data != null && data is Map) {
        final notif = AdminNotificationEntity.fromJson(data as Map<String, dynamic>);
        _notificationController.add(notif);
      }
    });

    _socket?.connect();

    if (_socket?.connected == true) {
      debugPrint('Socket already connected (reused). Emitting authenticate event...');
      _socket?.emit('authenticate', {'token': formattedToken});
    }
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }
}
