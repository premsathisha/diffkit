import {
	CircleIcon,
	FolderLibraryIcon,
	GitMergeIcon,
	GitPullRequestClosedIcon,
	GitPullRequestDraftIcon,
	GitPullRequestIcon,
	UserCircleIcon,
} from "@diffkit/icons";
import { createElement } from "react";
import type {
	FilterableItem,
	FilterDefinition,
	SortOption,
} from "./use-list-filters";

type PullFilterableItem = FilterableItem & {
	isDraft: boolean;
	mergedAt: string | null;
};

function asPull(item: FilterableItem): PullFilterableItem {
	return item as PullFilterableItem;
}

const pullStatusFilterOptions = [
	{ value: "open", label: "Open", icon: GitPullRequestIcon },
	{ value: "draft", label: "Draft", icon: GitPullRequestDraftIcon },
	{ value: "merged", label: "Merged", icon: GitMergeIcon },
	{ value: "closed", label: "Closed", icon: GitPullRequestClosedIcon },
] as const;

const pullStatusColorMap: Record<string, string> = {
	open: "text-green-500",
	draft: "text-muted-foreground",
	merged: "text-purple-500",
	closed: "text-red-500",
};

function getPullStatusFilterOptions() {
	return pullStatusFilterOptions.map((status) => ({
		value: status.value,
		label: status.label,
		icon: createElement(status.icon, {
			size: 14,
			className: pullStatusColorMap[status.value],
		}),
	}));
}

function getPullStatusValue(pull: PullFilterableItem) {
	if (pull.mergedAt || pull.state === "merged") return "merged";
	if (pull.state === "closed") return "closed";
	if (pull.isDraft) return "draft";
	return "open";
}

function matchPullStatus(item: FilterableItem, values: Set<string>) {
	if (values.has("all")) return true;

	const validValues = pullStatusFilterOptions.filter((status) =>
		values.has(status.value),
	);
	if (
		validValues.length === 0 ||
		validValues.length === pullStatusFilterOptions.length
	) {
		return true;
	}

	return values.has(getPullStatusValue(asPull(item)));
}

export const pullFilterDefs: FilterDefinition[] = [
	{
		id: "repo",
		label: "Repository",
		icon: FolderLibraryIcon,
		extractOptions: (items) => {
			const repos = new Map<string, string>();
			for (const item of items) {
				const name = item.repository.fullName;
				if (!repos.has(name)) repos.set(name, name);
			}
			return [...repos.entries()]
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([value, label]) => ({ value, label }));
		},
		match: (item, values) => values.has(item.repository.fullName),
	},
	{
		id: "author",
		label: "Author",
		icon: UserCircleIcon,
		extractOptions: (items) => {
			const authors = new Map<string, { login: string; avatarUrl: string }>();
			for (const item of items) {
				if (item.author && !authors.has(item.author.login)) {
					authors.set(item.author.login, item.author);
				}
			}
			return [...authors.entries()]
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([login, author]) => ({
					value: login,
					label: login,
					icon: createElement("img", {
						src: author.avatarUrl,
						alt: login,
						className: "size-4 rounded-full",
					}),
				}));
		},
		match: (item, values) =>
			item.author ? values.has(item.author.login) : false,
	},
	{
		id: "status",
		label: "Status",
		icon: CircleIcon,
		extractOptions: getPullStatusFilterOptions,
		match: matchPullStatus,
	},
];

/** Filter defs for repo-scoped pull lists — static options, no repository filter. */
export const repoPullFilterDefs: FilterDefinition[] = [
	{
		id: "status",
		label: "Status",
		icon: CircleIcon,
		extractOptions: getPullStatusFilterOptions,
		match: matchPullStatus,
	},
	{
		id: "author",
		label: "Author",
		icon: UserCircleIcon,
		extractOptions: (items) => {
			const authors = new Map<string, { login: string; avatarUrl: string }>();
			for (const item of items) {
				if (item.author && !authors.has(item.author.login)) {
					authors.set(item.author.login, item.author);
				}
			}
			return [...authors.entries()]
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([login, author]) => ({
					value: login,
					label: login,
					icon: createElement("img", {
						src: author.avatarUrl,
						alt: login,
						className: "size-4 rounded-full",
					}),
				}));
		},
		match: (item, values) =>
			item.author ? values.has(item.author.login) : false,
	},
];

export const pullSortOptions: SortOption[] = [
	{
		id: "updated",
		label: "Recently updated",
		compare: (a, b) =>
			new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
	},
	{
		id: "created",
		label: "Newest first",
		compare: (a, b) =>
			new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	},
	{
		id: "created-asc",
		label: "Oldest first",
		compare: (a, b) =>
			new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
	},
	{
		id: "comments",
		label: "Most comments",
		compare: (a, b) => b.comments - a.comments,
	},
	{
		id: "title",
		label: "Title A–Z",
		compare: (a, b) => a.title.localeCompare(b.title),
	},
];
