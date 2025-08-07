import 'package:flutter/material.dart';

Future<void> presentNavigate(BuildContext context, Widget child) async {
  await Navigator.push(
    context,
    PageRouteBuilder(
      pageBuilder: (context, animation, secondaryAnimation) => child,
      transitionsBuilder: (context, animation, secondaryAnimation, child) {
        const begin = Offset(0.0, 1.0);
        const end = Offset.zero;
        const curve = Curves.ease;

        final tween = Tween(
          begin: begin,
          end: end,
        ).chain(CurveTween(curve: curve));
        final offsetAnimation = animation.drive(tween);

        return SlideTransition(position: offsetAnimation, child: child);
      },
      transitionDuration: const Duration(
        milliseconds: 300,
      ), // Optional: Adjust duration
    ),
  );
}

Future<void> pushNavigate(BuildContext context, Widget child) async {
  await Navigator.push(context, MaterialPageRoute(builder: (context) => child));
}

void popNavigate(BuildContext context) {
  if (Navigator.canPop(context)) {
    Navigator.pop(context);
  } else {
    debugPrint("No route to pop");
  }
}

void popToRootNavigate(BuildContext context) {
  Navigator.popUntil(context, (route) => route.isFirst);
}

Future<void> pushReplaceNavigate(BuildContext context, Widget child) async {
  await Navigator.pushReplacement(
    context,
    MaterialPageRoute(builder: (context) => child),
  );
}

Future<void> pushAndRemoveUntilRootNavigate(
  BuildContext context,
  Widget child,
) async {
  await Navigator.pushAndRemoveUntil(
    context,
    MaterialPageRoute(builder: (context) => child),
    (route) => route.isFirst,
  );
}
