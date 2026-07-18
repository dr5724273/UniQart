import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:dio/dio.dart';
import '../constants/api_constants.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp();
  } catch (_) {}
}

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  bool _isInitialized = false;

  final Set<String> _processedIds = {};
  String? _fcmToken;
  String? get fcmToken => _fcmToken;

  final StreamController<Map<String, String>> onNotificationClick =
      StreamController<Map<String, String>>.broadcast();
  Map<String, String>? pendingNavigationPayload;

  bool isDuplicateNotification(String id) {
    if (id.isEmpty) return false;
    if (_processedIds.contains(id)) return true;
    _processedIds.add(id);
    if (_processedIds.length > 500) {
      _processedIds.remove(_processedIds.first);
    }
    return false;
  }

  Future<void> initialize() async {
    if (_isInitialized) return;
    _isInitialized = true;

    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const initSettings = InitializationSettings(android: androidSettings);
    
    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (details) {
        if (details.payload != null && details.payload!.isNotEmpty) {
          try {
            final data = jsonDecode(details.payload!) as Map<String, dynamic>;
            final type = data['type']?.toString() ?? '';
            final url = data['url']?.toString() ?? '';
            if (type.isNotEmpty || url.isNotEmpty) {
              final payloadMap = {'type': type, 'url': url};
              pendingNavigationPayload = payloadMap;
              onNotificationClick.add(payloadMap);
            }
          } catch (_) {}
        }
      },
    );

    const androidChannel = AndroidNotificationChannel(
      'admin_high_importance_channel',
      'Admin High Importance Notifications',
      description: 'This channel is used for real-time admin approval requests.',
      importance: Importance.max,
      playSound: true,
      enableVibration: true,
    );

    final androidPlugin = _localNotifications.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
    if (androidPlugin != null) {
      await androidPlugin.createNotificationChannel(androidChannel);
      await androidPlugin.requestNotificationsPermission();
    }

    try {
      await Firebase.initializeApp();
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      final messaging = FirebaseMessaging.instance;
      await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );

      try {
        await messaging.subscribeToTopic('admin');
      } catch (_) {}

      // Handle terminated app launch from FCM notification click
      final initialMessage = await messaging.getInitialMessage();
      if (initialMessage != null && initialMessage.data.isNotEmpty) {
        final type = initialMessage.data['type']?.toString() ?? '';
        final url = initialMessage.data['url']?.toString() ?? '';
        if (type.isNotEmpty || url.isNotEmpty) {
          pendingNavigationPayload = {'type': type, 'url': url};
        }
      }

      // Handle background app open from FCM notification click
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        if (message.data.isNotEmpty) {
          final type = message.data['type']?.toString() ?? '';
          final url = message.data['url']?.toString() ?? '';
          if (type.isNotEmpty || url.isNotEmpty) {
            final payloadMap = {'type': type, 'url': url};
            pendingNavigationPayload = payloadMap;
            onNotificationClick.add(payloadMap);
          }
        }
      });

      // Handle foreground FCM messages
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        final id = message.data['id']?.toString() ?? message.messageId ?? '';
        if (isDuplicateNotification(id)) return;

        final notification = message.notification;
        if (notification != null) {
          showSystemNotification(
            title: notification.title ?? 'New Admin Notification',
            body: notification.body ?? 'You have a new approval request.',
            payload: jsonEncode(message.data),
          );
        }
      });
    } catch (e) {
      debugPrint('FCM setup skipped or not ready: $e');
    }
  }

  Future<void> registerAndSendTokenToBackend(String authToken) async {
    try {
      if (!authToken.startsWith('Bearer ')) return;
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null && token.isNotEmpty) {
        _fcmToken = token;
        final dio = Dio(BaseOptions(
          baseUrl: ApiConstants.baseUrl,
          headers: {'Authorization': authToken},
        ));
        await dio.post('/auth/fcm-token', data: {'token': token});
        debugPrint('FCM token sent to backend: $token');
      }
    } catch (e) {
      debugPrint('Failed to send FCM token to backend: $e');
    }
  }

  Future<void> unregisterTokenFromBackend(String authToken) async {
    try {
      if (_fcmToken == null || _fcmToken!.isEmpty) return;
      final dio = Dio(BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        headers: {'Authorization': authToken},
      ));
      await dio.delete('/auth/fcm-token', data: {'token': _fcmToken});
      _fcmToken = null;
    } catch (e) {
      debugPrint('Failed to unregister FCM token from backend: $e');
    }
  }

  Future<void> showSystemNotification({
    required String title,
    required String body,
    int? id,
    String? payload,
  }) async {
    try {
      HapticFeedback.vibrate();
      SystemSound.play(SystemSoundType.click);

      final notifId = id ?? DateTime.now().millisecondsSinceEpoch.remainder(100000);
      
      const androidDetails = AndroidNotificationDetails(
        'admin_high_importance_channel',
        'Admin High Importance Notifications',
        channelDescription: 'This channel is used for real-time admin approval requests.',
        importance: Importance.max,
        priority: Priority.high,
        playSound: true,
        enableVibration: true,
        icon: '@mipmap/ic_launcher',
      );

      const details = NotificationDetails(android: androidDetails);

      await _localNotifications.show(
        notifId,
        title,
        body,
        details,
        payload: payload,
      );
    } catch (e) {
      debugPrint('Error showing local notification: $e');
    }
  }
}
