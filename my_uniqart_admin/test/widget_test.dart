import 'package:flutter_test/flutter_test.dart';
import 'package:my_uniqart_admin/main.dart';

void main() {
  testWidgets('MyUniQartAdminApp loads initial auth check', (WidgetTester tester) async {
    await tester.pumpWidget(const MyUniQartAdminApp());
    expect(find.byType(MyUniQartAdminApp), findsOneWidget);
  });
}
