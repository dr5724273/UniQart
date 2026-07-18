import 'dart:async';
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

    _socket = io.io(
      ApiConstants.baseUrl,
      io.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .setAuth({'token': formattedToken})
          .setExtraHeaders({'Authorization': formattedToken})
          .enableAutoConnect()
          .enableReconnection()
          .setReconnectionAttempts(99999)
          .setReconnectionDelay(2000)
          .build(),
    );

    _socket?.onConnect((_) {
      _socket?.emit('authenticate', {'token': formattedToken});
    });

    _socket?.on('admin_notification', (data) {
      if (data != null && data is Map) {
        final notif = AdminNotificationEntity.fromJson(data as Map<String, dynamic>);
        _notificationController.add(notif);
      }
    });
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }
}
