<section class="panel" aria-labelledby="t-live">
    <div class="panel-head">
        <h2 id="t-live" class="h3"><span class="pulse d-inline-block me-2" aria-hidden="true"></span>Leilões ao vivo</h2>
        <span class="live-status small" data-live-status aria-live="polite">a ligar…</span>
    </div>
    <div class="live-body" data-live-auctions data-src="{{ route('auctions.live') }}">
        @include('partials.live-auctions', ['auctions' => $liveAuctions])
    </div>
</section>

@once
    @push('scripts')
        <script src="https://cdn.jsdelivr.net/npm/socket.io-client@4.8.1/dist/socket.io.min.js"></script>
        <script src="{{ asset('js/live.js') }}?v={{ filemtime(public_path('js/live.js')) }}"></script>
    @endpush
@endonce
