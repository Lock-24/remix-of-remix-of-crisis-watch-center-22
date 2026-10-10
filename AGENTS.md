<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep SafeSphere as a client-side demo with localStorage persistence because the user explicitly requested no API or external notification integration.
- Keep the shared team presentation in the footer so editable member details appear consistently without a separate Team view.
- Keep ambient canvas rendering isolated in CampusBackground, throttled and reduced-motion aware, to preserve smooth interaction without browser-only imports in SSR.
- Derive alert audience from unique unblocked local accounts, snapshot recipients on send, and count each recipient acknowledgement once; never treat audience as verified delivery.
- Keep scroll effects in ScrollEffects using native passive scrolling and viewport observers; respect reduced motion and never delay emergency overlays or focused controls.
