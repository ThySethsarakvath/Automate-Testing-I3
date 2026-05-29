import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_counter_test/counter_widget.dart';

void main() {
  // Helper: wraps the widget in MaterialApp so tests have full context
  Widget buildWidget() => const MaterialApp(home: CounterWidget());

  group('CounterWidget', () {

    testWidgets('initial count is 0', (tester) async {
      await tester.pumpWidget(buildWidget());

      expect(find.byKey(const Key('counterText')), findsOneWidget);
      expect(find.text('0'), findsOneWidget);
    });

    testWidgets('increment button increases count by 1', (tester) async {
      await tester.pumpWidget(buildWidget());

      await tester.tap(find.byKey(const Key('incrementButton')));
      await tester.pump();

      expect(find.text('1'), findsOneWidget);
    });

    testWidgets('decrement button decreases count by 1', (tester) async {
      await tester.pumpWidget(buildWidget());

      await tester.tap(find.byKey(const Key('decrementButton')));
      await tester.pump();

      expect(find.text('-1'), findsOneWidget);
    });

    testWidgets('multiple increments accumulate correctly', (tester) async {
      await tester.pumpWidget(buildWidget());

      await tester.tap(find.byKey(const Key('incrementButton')));
      await tester.tap(find.byKey(const Key('incrementButton')));
      await tester.tap(find.byKey(const Key('incrementButton')));
      await tester.pump();

      expect(find.text('3'), findsOneWidget);
    });

    testWidgets('multiple decrements accumulate correctly', (tester) async {
      await tester.pumpWidget(buildWidget());

      await tester.tap(find.byKey(const Key('decrementButton')));
      await tester.tap(find.byKey(const Key('decrementButton')));
      await tester.pump();

      expect(find.text('-2'), findsOneWidget);
    });

    testWidgets('increment then decrement returns to 0', (tester) async {
      await tester.pumpWidget(buildWidget());

      await tester.tap(find.byKey(const Key('incrementButton')));
      await tester.pump();
      expect(find.text('1'), findsOneWidget);

      await tester.tap(find.byKey(const Key('decrementButton')));
      await tester.pump();
      expect(find.text('0'), findsOneWidget);
    });

    testWidgets('both buttons are present on screen', (tester) async {
      await tester.pumpWidget(buildWidget());

      expect(find.byKey(const Key('incrementButton')), findsOneWidget);
      expect(find.byKey(const Key('decrementButton')), findsOneWidget);
    });

    testWidgets('counter text updates after each tap', (tester) async {
      await tester.pumpWidget(buildWidget());

      for (int i = 1; i <= 5; i++) {
        await tester.tap(find.byKey(const Key('incrementButton')));
        await tester.pump();
        expect(find.text('$i'), findsOneWidget);
      }
    });
  });
}