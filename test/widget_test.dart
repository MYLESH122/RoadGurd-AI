import 'package:flutter_test/flutter_test.dart';
import 'package:roadguard_app/main.dart';

void main() {
  testWidgets('RoadGuardApp launches splash screen test', (WidgetTester tester) async {
    await tester.pumpWidget(const RoadGuardApp());
    expect(find.text('ROADGUARD AI'), findsOneWidget);
    expect(find.text('Stay Awake. Stay Alert. Stay Safe.'), findsOneWidget);

    // Advance fake async timer past 2 seconds
    await tester.pump(const Duration(seconds: 3));
    await tester.pump(const Duration(milliseconds: 500));
  });
}
