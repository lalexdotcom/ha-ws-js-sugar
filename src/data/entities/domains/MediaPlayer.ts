import { parseJSON } from "date-fns";
import { BaseEntity } from "../Entity";

const MediaPlayerStates = {
	OFF: "off",
	ON: "on",
	IDLE: "idle",
	PLAYING: "playing",
	PAUSED: "paused",
	STANDBY: "standby",
	BUFFERING: "buffering",
} as const;

export type MediaPlayerState =
	(typeof MediaPlayerStates)[keyof typeof MediaPlayerStates];

export const MediaPlayerDeviceClasses = {
	TV: "tv",
	SPEAKER: "speaker",
	RECEIVER: "receiver",
} as const;

export type MediaPlayerDeviceClass =
	(typeof MediaPlayerDeviceClasses)[keyof typeof MediaPlayerDeviceClasses];

export const MediaClasses = {
	ALBUM: "album",
	APP: "app",
	ARTIST: "artist",
	CHANNEL: "channel",
	COMPOSER: "composer",
	CONTRIBUTING_ARTIST: "contributing_artist",
	DIRECTORY: "directory",
	EPISODE: "episode",
	GAME: "game",
	GENRE: "genre",
	IMAGE: "image",
	MOVIE: "movie",
	MUSIC: "music",
	PLAYLIST: "playlist",
	PODCAST: "podcast",
	SEASON: "season",
	TRACK: "track",
	TV_SHOW: "tv_show",
	URL: "url",
	VIDEO: "video",
} as const;

export type MediaClass = (typeof MediaClasses)[keyof typeof MediaClasses];

export const MediaContentTypes = {
	ALBUM: "album",
	APP: "app",
	APPS: "apps",
	ARTIST: "artist",
	CHANNEL: "channel",
	CHANNELS: "channels",
	COMPOSER: "composer",
	CONTRIBUTING_ARTIST: "contributing_artist",
	EPISODE: "episode",
	GAME: "game",
	GENRE: "genre",
	IMAGE: "image",
	MOVIE: "movie",
	MUSIC: "music",
	PLAYLIST: "playlist",
	PODCAST: "podcast",
	SEASON: "season",
	TRACK: "track",
	TVSHOW: "tvshow",
	URL: "url",
	VIDEO: "video",
} as const;

export type MediaContentType =
	| (typeof MediaContentTypes)[keyof typeof MediaContentTypes]
	| (string & {});

export const MediaPlayerFeatures = {
	PAUSE: 1,
	SEEK: 2,
	VOLUME_SET: 4,
	VOLUME_MUTE: 8,
	PREVIOUS_TRACK: 16,
	NEXT_TRACK: 32,

	TURN_ON: 128,
	TURN_OFF: 256,
	PLAY_MEDIA: 512,
	VOLUME_STEP: 1024,
	SELECT_SOURCE: 2048,
	STOP: 4096,
	CLEAR_PLAYLIST: 8192,
	PLAY: 16384,
	SHUFFLE_SET: 32768,
	SELECT_SOUND_MODE: 65536,
	BROWSE_MEDIA: 131072,
	REPEAT_SET: 262144,
	GROUPING: 524288,
	MEDIA_ANNOUNCE: 1048576,
	MEDIA_ENQUEUE: 2097152,
	SEARCH_MEDIA: 4194304,
} as const;

export type MediaPlayerFeature =
	(typeof MediaPlayerFeatures)[keyof typeof MediaPlayerFeatures];

export const MediaPlayerRepeatModes = {
	ALL: "all",
	OFF: "off",
	ONE: "one",
} as const;

export type MediaPlayerRepeatMode =
	(typeof MediaPlayerRepeatModes)[keyof typeof MediaPlayerRepeatModes];

export type MediaPlayerBrowseResultMedia = {
	title: string;
	mediaClass: MediaClass;
	childrenMediaClass?: MediaClass;
	mediaContentType: MediaContentType;
	mediaContentId: string;

	canPlay?: boolean;
	canExpand?: boolean;
	canSearch?: boolean;

	thumbnail?: string;
};

export type MediaPlayerBrowseResult = MediaPlayerBrowseResultMedia & {
	notShown?: number;
	children?: MediaPlayerBrowseResultMedia[];
};

export const MediaPlayerEnqueueModes = {
	ADD: "add",
	NEXT: "next",
	PLAY: "play",
	REPLACE: "replace",
};

export type MediaPlayerEnqueueMode =
	(typeof MediaPlayerEnqueueModes)[keyof typeof MediaPlayerEnqueueModes];

export type Media = {
	contentId: string;
	contentType?: MediaContentType | (string & {});

	title?: string;
	artist?: string;
	album?: string;
	track?: number;
	albumArtist?: string;

	duration?: number;
	position?: number;
	positionUpdatedAt?: Date;

	imageUrl?: string;
	imageRemotelyAccessible?: boolean;

	seriesTitle?: string;
	season?: number;
	episode?: number;
	channel?: string;

	playlist?: string;
};

const PlayMediaStreamType = {
	BUFFERED: "buffered",
	NONE: "none",
	LIVE: "live",
};

export type PlayMediaStreamType =
	(typeof PlayMediaStreamType)[keyof typeof PlayMediaStreamType];

export type PlayMediaOptions = {
	enqueue?: MediaPlayerEnqueueMode;
	announce?: boolean;
	title?: string;
	thumb?: string;
	currentTime?: number;
	autoPlay?: boolean; // default true
	streamType?: PlayMediaStreamType;
	subtitles?: string;
	subtitlesLang?: string;
	subtitlesMimeType?: string;
	subtitleId?: number;
	mediaInfo?: Record<string, unknown>;
	metadata?: Record<string, unknown>;
};

const PLAY_MEDIA_OPTIONS_KEYS_MAP: Partial<
	Record<keyof PlayMediaOptions, string>
> = {
	currentTime: "current_time",
	autoPlay: "autoplay",
	streamType: "stream_type",
	subtitlesLang: "subtitles_lang",
	subtitlesMimeType: "subtitles_mime",
	subtitleId: "subtitle_id",
	mediaInfo: "media_info",
};
export class MediaPlayer extends BaseEntity<
	MediaPlayerState,
	MediaPlayerFeature
> {
	get deviceClass() {
		return this.rawEntity.attributes.device_class as
			| MediaPlayerDeviceClass
			| undefined;
	}

	seek(seek_position: number) {
		return this.callAction("media_seek", { seek_position });
	}

	play(): Promise<unknown>;
	play(
		media_content_id: string,
		media_content_type: MediaContentType,
		options?: PlayMediaOptions,
	): Promise<unknown>;
	play(
		media_content_id?: string,
		media_content_type?: MediaContentType,
		options?: PlayMediaOptions,
	) {
		if (media_content_id !== undefined) {
			const { enqueue, announce, ...rest } = options || {};
			const playMediaOptions: Record<string, unknown> = {};
			if (enqueue !== undefined) {
				playMediaOptions.enqueue = enqueue;
			}
			if (announce !== undefined) {
				playMediaOptions.announce = announce;
			}
			if (Object.keys(rest).length > 0) {
				playMediaOptions.extra = Object.fromEntries(
					Object.entries(rest).map(([key, value]) => [
						PLAY_MEDIA_OPTIONS_KEYS_MAP[key as keyof PlayMediaOptions] ?? key,
						value,
					]),
				);
			}
			return this.callAction("play_media", {
				media_content_id,
				media_content_type,
				...playMediaOptions,
			});
		} else {
			return this.callAction("media_play");
		}
	}

	get appId() {
		return this.rawEntity.attributes.app_id as string | undefined;
	}

	get appName() {
		return this.rawEntity.attributes.app_name as string | undefined;
	}

	get volume() {
		return (this.rawEntity.attributes.volume_level as number) ?? Number.NaN;
	}

	setVolume(volume_level: number) {
		return this.callAction("volume_set", { volume_level });
	}

	get isMuted() {
		return this.rawEntity.attributes.is_volume_muted as boolean | undefined;
	}

	mute(is_volume_muted = true) {
		return this.callAction("volume_mute", { is_volume_muted });
	}

	get sources() {
		return this.rawEntity.attributes.source_list as string[] | undefined;
	}

	get source() {
		return this.rawEntity.attributes.source as string | undefined;
	}

	setSource(source: string) {
		return this.callAction("select_source", { source });
	}

	get repeatMode() {
		return this.rawEntity.attributes.repeat as
			| MediaPlayerRepeatMode
			| undefined;
	}

	setRepeatMode(repeat: MediaPlayerRepeatMode) {
		return this.callAction("repeat_set", { repeat });
	}

	get shuffle() {
		return this.rawEntity.attributes.shuffle as boolean;
	}

	setShuffle(shuffle: boolean) {
		return this.callAction("shuffle_set", { shuffle });
	}

	get media(): Media | undefined {
		return this.rawEntity.attributes.media_content_id
			? ({
					contentId: this.rawEntity.attributes.media_content_id,
					contentType: this.rawEntity.attributes.media_content_type,

					title: this.rawEntity.attributes.media_title,
					artist: this.rawEntity.attributes.media_artist,
					album: this.rawEntity.attributes.media_album_name,
					track: this.rawEntity.attributes.media_track,
					albumArtist: this.rawEntity.attributes.media_album_artist,

					duration: this.rawEntity.attributes.media_duration,
					position: this.rawEntity.attributes.media_position,
					positionUpdatedAt: this.rawEntity.attributes.media_position_updated_at
						? parseJSON(this.rawEntity.attributes.media_position_updated_at)
						: undefined,

					imageUrl: this.rawEntity.attributes.media_image_url,
					imageRemotelyAccessible:
						this.rawEntity.attributes.media_image_remotely_accessible,

					seriesTitle: this.rawEntity.attributes.media_series_title,
					season: this.rawEntity.attributes.media_season,
					episode: this.rawEntity.attributes.media_episode,
					channel: this.rawEntity.attributes.media_channel,

					playlist: this.rawEntity.attributes.media_playlist,
				} satisfies Media)
			: undefined;
	}

	get soundModes() {
		return this.rawEntity.attributes.sound_mode_list as string[] | undefined;
	}

	get soundMode() {
		return this.rawEntity.attributes.sound_mode as string | undefined;
	}

	setSoundMode(sound_mode: string) {
		return this.callAction("select_sound_mode", { sound_mode });
	}

	join(members: MediaPlayer[]) {
		const entity_ids = members.map((member) => member.id);
		return this.callAction("join", { group_members: entity_ids });
	}

	unjoin() {
		return this.callAction("unjoin");
	}

	async browse(params?: { contentId: string; contentType: MediaContentType }) {
		type BrowseResultMedia = {
			title: string;
			media_content_id: string;
			media_class: MediaClass;
			media_content_type: MediaContentType;
			children_media_class?: MediaClass;
			can_play: boolean;
			can_expand: boolean;
			can_search: boolean;
			thumbnail?: string;
		};

		type BrowseResultResponse = {
			response?: {
				[k: string]: BrowseResultMedia & {
					not_shown?: number;
					children: BrowseResultMedia[];
				};
			};
		};

		const browseParams: Record<string, unknown> = {};
		if (params) {
			browseParams.media_content_id = params.contentId;
			browseParams.media_content_type = params.contentType;
		}
		const browseResult = await this.callAction<BrowseResultResponse>(
			"browse_media",
			browseParams,
			true,
		);

		const playerBrowseResult = browseResult.response?.[this.id];
		if (playerBrowseResult) {
			const result: MediaPlayerBrowseResult = {
				title: playerBrowseResult.title,
				mediaClass: playerBrowseResult.media_class,
				childrenMediaClass: playerBrowseResult.children_media_class,
				mediaContentType: playerBrowseResult.media_content_type,
				mediaContentId: playerBrowseResult.media_content_id,
				canPlay: playerBrowseResult.can_play,
				canExpand: playerBrowseResult.can_expand,
				canSearch: playerBrowseResult.can_search,
				thumbnail: playerBrowseResult.thumbnail,
				notShown: playerBrowseResult.not_shown,
				children: playerBrowseResult.children.map((child) => ({
					title: child.title,
					mediaClass: child.media_class,
					childrenMediaClass: child.children_media_class,
					mediaContentType: child.media_content_type,
					mediaContentId: child.media_content_id,
					canPlay: child.can_play,
					canExpand: child.can_expand,
					canSearch: child.can_search,
					thumbnail: child.thumbnail,
				})),
			};
			return result;
		}
	}
}
