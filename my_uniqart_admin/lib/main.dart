import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'presentation/providers/auth_provider.dart';
import 'presentation/providers/dashboard_provider.dart';
import 'presentation/providers/vehicle_provider.dart';
import 'presentation/providers/finance_offer_provider.dart';
import 'presentation/providers/loan_request_provider.dart';
import 'presentation/providers/notification_provider.dart';
import 'presentation/screens/home/home_screen.dart';
import 'presentation/screens/login/login_screen.dart';
import 'presentation/screens/splash/splash_screen.dart';
import 'presentation/widgets/authenticated_shell.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MyUniQartAdminApp());
}

class MyUniQartAdminApp extends StatelessWidget {
  const MyUniQartAdminApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()..checkAuthStatus()),
        ChangeNotifierProvider(create: (_) => DashboardProvider()),
        ChangeNotifierProvider(create: (_) => VehicleProvider()),
        ChangeNotifierProvider(create: (_) => FinanceOfferProvider()),
        ChangeNotifierProvider(create: (_) => LoanRequestProvider()),
        ChangeNotifierProvider(create: (_) => NotificationProvider()),
      ],
      child: Consumer<AuthProvider>(
        builder: (context, authProvider, _) {
          return MaterialApp(
            title: 'MyUniQart Admin',
            debugShowCheckedModeBanner: false,
            theme: ThemeData(
              useMaterial3: true,
              colorScheme: ColorScheme.fromSeed(
                seedColor: const Color(0xFF1E40AF), // Deep royal blue primary
                brightness: Brightness.light,
              ),
              inputDecorationTheme: const InputDecorationTheme(
                filled: true,
                contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              ),
            ),
            home: _getHomeWidget(authProvider),
          );
        },
      ),
    );
  }

  Widget _getHomeWidget(AuthProvider authProvider) {
    if (authProvider.status == AuthStatus.loading || authProvider.status == AuthStatus.initial) {
      return const SplashScreen();
    }
    if (authProvider.status == AuthStatus.authenticated) {
      return const AuthenticatedShell(child: HomeScreen());
    }
    return const LoginScreen();
  }
}
