/**
 * Copyright (c) 2026 Ronan LE MEILLAT - SCTG Development
 * License: AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

// src/core/migration.ts

/**
 * KNOWN_V2_IMPORTS: maps v2 standalone component names to their v3 compound equivalents
 * or provides a hint about their status.
 */
export const KNOWN_V2_IMPORTS: Record<string, string> = {
    // ─── PACKAGES ──────────────────────────────────────────────────────────────
    "@nextui-org/react": "legacy package — replace with @heroui/react",
    "@heroui/react": "check version; v3 compound API differs from v2",

    // ─── REMOVED / RENAMED STANDALONE COMPONENTS ───────────────────────────────
    "Navbar": "NOT IN v3: no official Navbar component yet; build custom or wait for v3 release",
    "NavbarBrand": "NOT IN v3: legacy Navbar subcomponent",
    "NavbarContent": "NOT IN v3: legacy Navbar subcomponent",
    "NavbarItem": "NOT IN v3: legacy Navbar subcomponent",
    "NavbarMenuToggle": "NOT IN v3: legacy Navbar subcomponent",
    "NavbarMenu": "NOT IN v3: legacy Navbar subcomponent",
    "NavbarMenuItem": "NOT IN v3: legacy Navbar subcomponent",

    "CircularProgress": "RENAMED: use ProgressBar in v3 (with progressBarVariant prop for circular shape)",
    "LinearProgress": "RENAMED: use ProgressBar in v3",
    "ModalContent": "REMOVED: in v3, Modal uses compound parts directly (Modal.Body, Modal.Heading, etc.)",

    // ─── ACCORDION ─────────────────────────────────────────────────────────────
    "AccordionItem": "use Accordion.Item inside Accordion",

    // ─── AUTOCOMPLETE ──────────────────────────────────────────────────────────
    "AutocompleteItem": "use Autocomplete.Item (compound) inside Autocomplete",
    "AutocompleteSection": "use Autocomplete.Section (compound) inside Autocomplete",
    "AutocompleteClearButton": "use Autocomplete.ClearButton inside Autocomplete",
    "AutocompleteFilter": "use Autocomplete.Filter inside Autocomplete",
    "AutocompleteIndicator": "use Autocomplete.Indicator inside Autocomplete",
    "AutocompletePopover": "use Autocomplete.Popover inside Autocomplete",
    "AutocompleteTrigger": "use Autocomplete.Trigger inside Autocomplete",
    "AutocompleteValue": "use Autocomplete.Value inside Autocomplete",

    // ─── AVATAR ────────────────────────────────────────────────────────────────
    "AvatarGroup": "still named AvatarGroup in v3 (not compound yet)",
    "AvatarIcon": "still named AvatarIcon (pass as prop to Avatar)",
    "AvatarFallback": "use Avatar.Fallback inside Avatar",
    "AvatarImage": "use Avatar.Image inside Avatar",

    // ─── BADGE ─────────────────────────────────────────────────────────────────
    "BadgeAnchor": "use Badge.Anchor inside Badge",
    "BadgeLabel": "use Badge.Label inside Badge",

    // ─── BREADCRUMBS ───────────────────────────────────────────────────────────
    "BreadcrumbItem": "use Breadcrumbs.Item inside Breadcrumbs",
    "BreadcrumbsItem": "use Breadcrumbs.Item inside Breadcrumbs",

    // ─── CALENDAR ──────────────────────────────────────────────────────────────
    "CalendarCell": "use Calendar.Cell inside Calendar",
    "CalendarCellIndicator": "use Calendar.CellIndicator inside Calendar",
    "CalendarGrid": "use Calendar.Grid inside Calendar",
    "CalendarGridBody": "use Calendar.GridBody inside Calendar",
    "CalendarGridHeader": "use Calendar.GridHeader inside Calendar",
    "CalendarHeader": "use Calendar.Header inside Calendar",
    "CalendarHeaderCell": "use Calendar.HeaderCell inside Calendar",
    "CalendarHeading": "use Calendar.Heading inside Calendar",
    "CalendarNavButton": "use Calendar.NavButton inside Calendar",
    "CalendarYearPickerCell": "use Calendar.YearPickerCell inside Calendar",
    "CalendarYearPickerGrid": "use Calendar.YearPickerGrid inside Calendar",
    "CalendarYearPickerGridBody": "use Calendar.YearPickerGridBody inside Calendar",
    "CalendarYearPickerTrigger": "use Calendar.YearPickerTrigger inside Calendar",
    "CalendarYearPickerTriggerHeading": "use Calendar.YearPickerTriggerHeading inside Calendar",
    "CalendarYearPickerTriggerIndicator": "use Calendar.YearPickerTriggerIndicator inside Calendar",

    // ─── CARD ──────────────────────────────────────────────────────────────────
    "CardHeader": "use Card.Header inside Card",
    "CardBody": "use Card.Content inside Card (renamed Body→Content)",
    "CardFooter": "use Card.Footer inside Card",
    "CardContent": "use Card.Content inside Card",
    "CardDescription": "use Card.Description inside Card",
    "CardTitle": "use Card.Title inside Card",

    // ─── CHECKBOX ──────────────────────────────────────────────────────────────
    "CheckboxGroup": "CheckboxGroup still standalone in v3",
    "CheckboxContent": "use Checkbox.Content inside Checkbox",
    "CheckboxControl": "use Checkbox.Control inside Checkbox",
    "CheckboxIndicator": "use Checkbox.Indicator inside Checkbox",

    // ─── CHIP ──────────────────────────────────────────────────────────────────
    "ChipLabel": "use Chip.Label inside Chip",

    // ─── COLOR COMPONENTS ──────────────────────────────────────────────────────
    "ColorAreaThumb": "use ColorArea.Thumb inside ColorArea",
    "ColorFieldGroup": "use ColorField.Group inside ColorField",
    "ColorFieldInput": "use ColorField.Input inside ColorField",
    "ColorFieldPrefix": "use ColorField.Prefix inside ColorField",
    "ColorFieldSuffix": "use ColorField.Suffix inside ColorField",
    "ColorPickerPopover": "use ColorPicker.Popover inside ColorPicker",
    "ColorPickerTrigger": "use ColorPicker.Trigger inside ColorPicker",
    "ColorSliderOutput": "use ColorSlider.Output inside ColorSlider",
    "ColorSliderThumb": "use ColorSlider.Thumb inside ColorSlider",
    "ColorSliderTrack": "use ColorSlider.Track inside ColorSlider",
    "ColorSwatchPickerIndicator": "use ColorSwatchPicker.Indicator inside ColorSwatchPicker",
    "ColorSwatchPickerItem": "use ColorSwatchPicker.Item inside ColorSwatchPicker",
    "ColorSwatchPickerSwatch": "use ColorSwatchPicker.Swatch inside ColorSwatchPicker",

    // ─── COMBOBOX ──────────────────────────────────────────────────────────────
    "ComboBoxInputGroup": "use ComboBox.InputGroup inside ComboBox",
    "ComboBoxPopover": "use ComboBox.Popover inside ComboBox",
    "ComboBoxTrigger": "use ComboBox.Trigger inside ComboBox",

    // ─── DATE COMPONENTS ───────────────────────────────────────────────────────
    "DateInput": "RENAMED: use DateField in v3",
    "DateFieldGroup": "use DateField.Group inside DateField",
    "DateFieldInput": "use DateField.Input inside DateField",
    "DateFieldInputContainer": "use DateField.InputContainer inside DateField",
    "DateFieldPrefix": "use DateField.Prefix inside DateField",
    "DateFieldSegment": "use DateField.Segment inside DateField",
    "DateFieldSuffix": "use DateField.Suffix inside DateField",
    "DatePickerPopover": "use DatePicker.Popover inside DatePicker",
    "DatePickerRoot": "use DatePicker.Root inside DatePicker",
    "DatePickerTrigger": "use DatePicker.Trigger inside DatePicker",
    "DatePickerTriggerIndicator": "use DatePicker.TriggerIndicator inside DatePicker",
    "DateRangePickerPopover": "use DateRangePicker.Popover inside DateRangePicker",
    "DateRangePickerRangeSeparator": "use DateRangePicker.RangeSeparator inside DateRangePicker",
    "DateRangePickerRoot": "use DateRangePicker.Root inside DateRangePicker",
    "DateRangePickerTrigger": "use DateRangePicker.Trigger inside DateRangePicker",
    "DateRangePickerTriggerIndicator": "use DateRangePicker.TriggerIndicator inside DateRangePicker",

    // ─── DISCLOSURE ────────────────────────────────────────────────────────────
    "DisclosureBody": "use Disclosure.Body inside Disclosure",
    "DisclosureContent": "use Disclosure.Content inside Disclosure",
    "DisclosureHeading": "use Disclosure.Heading inside Disclosure",
    "DisclosureIndicator": "use Disclosure.Indicator inside Disclosure",
    "DisclosureTrigger": "use Disclosure.Trigger inside Disclosure",

    // ─── DROPDOWN / SELECT / LISTBOX ───────────────────────────────────────────
    "DropdownTrigger": "use Dropdown.Trigger inside Dropdown",
    "DropdownMenu": "use Dropdown.Menu inside Dropdown (no longer wraps in Popover directly)",
    "DropdownItem": "use Dropdown.Item inside Dropdown",
    "DropdownSection": "use Dropdown.Section inside Dropdown",
    "SelectItem": "use Select.Item inside Select",
    "SelectSection": "use Select.Section inside Select",
    "SelectIndicator": "use Select.Indicator inside Select",
    "SelectPopover": "use Select.Popover inside Select",
    "SelectTrigger": "use Select.Trigger inside Select",
    "SelectValue": "use Select.Value inside Select",
    "Listbox": "use ListBox (capital B) as compound root",
    "ListboxItem": "use ListBox.Item inside ListBox",
    "ListboxSection": "use ListBox.Section inside ListBox",

    // ─── FIELDSET ──────────────────────────────────────────────────────────────
    "FieldsetActions": "use Fieldset.Actions inside Fieldset",
    "FieldsetGroup": "use Fieldset.Group inside Fieldset",
    "FieldsetLegend": "use Fieldset.Legend inside Fieldset",

    // ─── INPUT / FORM ──────────────────────────────────────────────────────────
    "InputGroupInput": "use InputGroup.Input inside InputGroup",
    "InputGroupPrefix": "use InputGroup.Prefix inside InputGroup",
    "InputGroupRoot": "use InputGroup.Root inside InputGroup",
    "InputGroupSuffix": "use InputGroup.Suffix inside InputGroup",
    "InputGroupTextArea": "use InputGroup.TextArea inside InputGroup",
    "InputOTPGroup": "use InputOTP.Group inside InputOTP",
    "InputOTPSeparator": "use InputOTP.Separator inside InputOTP",
    "InputOTPSlot": "use InputOTP.Slot inside InputOTP",

    // ─── KBD ───────────────────────────────────────────────────────────────────
    "KbdAbbr": "use Kbd.Abbr inside Kbd",
    "KbdContent": "use Kbd.Content inside Kbd",
    "KbdKey": "use Kbd.Key inside Kbd",

    // ─── LINK ──────────────────────────────────────────────────────────────────
    "LinkIcon": "use Link.Icon inside Link",

    // ─── MODAL / ALERTDIALOG ───────────────────────────────────────────────────
    "ModalBackdrop": "use Modal.Backdrop inside Modal",
    "ModalBody": "use Modal.Body inside Modal",
    "ModalCloseTrigger": "use Modal.CloseTrigger inside Modal",
    "ModalContainer": "use Modal.Container inside Modal",
    "ModalDialog": "use Modal.Dialog inside Modal",
    "ModalHeader": "use Modal.Heading inside Modal (renamed Header→Heading)",
    "ModalFooter": "use Modal.Body or restructure — no dedicated ModalFooter in v3",
    "ModalHeading": "use Modal.Heading inside Modal",
    "ModalIcon": "use Modal.Icon inside Modal",
    "AlertDialogBackdrop": "use AlertDialog.Backdrop inside AlertDialog",
    "AlertDialogBody": "use AlertDialog.Body inside AlertDialog",
    "AlertDialogCloseTrigger": "use AlertDialog.CloseTrigger inside AlertDialog",
    "AlertDialogContainer": "use AlertDialog.Container inside AlertDialog",
    "AlertDialogDialog": "use AlertDialog.Dialog inside AlertDialog",
    "AlertDialogFooter": "use AlertDialog.Footer inside AlertDialog",
    "AlertDialogHeader": "use AlertDialog.Header inside AlertDialog",
    "AlertDialogHeading": "use AlertDialog.Heading inside AlertDialog",
    "AlertDialogIcon": "use AlertDialog.Icon inside AlertDialog",
    "AlertDialogTrigger": "use AlertDialog.Trigger inside AlertDialog",

    // ─── ALERT ─────────────────────────────────────────────────────────────────
    "AlertContent": "use Alert.Content inside Alert",
    "AlertDescription": "use Alert.Description inside Alert",
    "AlertIndicator": "use Alert.Indicator inside Alert",
    "AlertTitle": "use Alert.Title inside Alert",

    // ─── NUMBER FIELD ──────────────────────────────────────────────────────────
    "NumberFieldDecrementButton": "use NumberField.DecrementButton inside NumberField",
    "NumberFieldGroup": "use NumberField.Group inside NumberField",
    "NumberFieldIncrementButton": "use NumberField.IncrementButton inside NumberField",
    "NumberFieldInput": "use NumberField.Input inside NumberField",

    // ─── PAGINATION ────────────────────────────────────────────────────────────
    "PaginationContent": "use Pagination.Content inside Pagination",
    "PaginationEllipsis": "use Pagination.Ellipsis inside Pagination",
    "PaginationLink": "use Pagination.Link inside Pagination",
    "PaginationNext": "use Pagination.Next inside Pagination",
    "PaginationNextIcon": "use Pagination.NextIcon inside Pagination",
    "PaginationPrevious": "use Pagination.Previous inside Pagination",
    "PaginationPreviousIcon": "use Pagination.PreviousIcon inside Pagination",
    "PaginationSummary": "use Pagination.Summary inside Pagination",

    // ─── POPOVER ───────────────────────────────────────────────────────────────
    "PopoverArrow": "use Popover.Arrow inside Popover",
    "PopoverContent": "use Popover.Content inside Popover",
    "PopoverDialog": "use Popover.Dialog inside Popover",
    "PopoverHeading": "use Popover.Heading inside Popover",
    "PopoverTrigger": "use Popover.Trigger inside Popover",

    // ─── RADIO ─────────────────────────────────────────────────────────────────
    "RadioGroup": "RadioGroup still standalone in v3 (no compound change)",
    "Radio": "Radio still standalone in v3",
    "RadioContent": "use Radio.Content inside Radio",
    "RadioControl": "use Radio.Control inside Radio",
    "RadioIndicator": "use Radio.Indicator inside Radio",

    // ─── RANGE CALENDAR ────────────────────────────────────────────────────────
    "RangeCalendarCell": "use RangeCalendar.Cell inside RangeCalendar",
    "RangeCalendarCellIndicator": "use RangeCalendar.CellIndicator inside RangeCalendar",
    "RangeCalendarGrid": "use RangeCalendar.Grid inside RangeCalendar",
    "RangeCalendarGridBody": "use RangeCalendar.GridBody inside RangeCalendar",
    "RangeCalendarGridHeader": "use RangeCalendar.GridHeader inside RangeCalendar",
    "RangeCalendarHeader": "use RangeCalendar.Header inside RangeCalendar",
    "RangeCalendarHeaderCell": "use RangeCalendar.HeaderCell inside RangeCalendar",
    "RangeCalendarHeading": "use RangeCalendar.Heading inside RangeCalendar",
    "RangeCalendarNavButton": "use RangeCalendar.NavButton inside RangeCalendar",
    "RangeCalendarYearPickerCell": "use RangeCalendar.YearPickerCell inside RangeCalendar",
    "RangeCalendarYearPickerGrid": "use RangeCalendar.YearPickerGrid inside RangeCalendar",
    "RangeCalendarYearPickerGridBody": "use RangeCalendar.YearPickerGridBody inside RangeCalendar",
    "RangeCalendarYearPickerTrigger": "use RangeCalendar.YearPickerTrigger inside RangeCalendar",
    "RangeCalendarYearPickerTriggerHeading": "use RangeCalendar.YearPickerTriggerHeading inside RangeCalendar",
    "RangeCalendarYearPickerTriggerIndicator": "use RangeCalendar.YearPickerTriggerIndicator inside RangeCalendar",

    // ─── SEARCH FIELD ──────────────────────────────────────────────────────────
    "SearchFieldClearButton": "use SearchField.ClearButton inside SearchField",
    "SearchFieldGroup": "use SearchField.Group inside SearchField",
    "SearchFieldInput": "use SearchField.Input inside SearchField",
    "SearchFieldSearchIcon": "use SearchField.SearchIcon inside SearchField",

    // ─── SLIDER ────────────────────────────────────────────────────────────────
    "SliderFill": "use Slider.Fill inside Slider",
    "SliderOutput": "use Slider.Output inside Slider",
    "SliderThumb": "use Slider.Thumb inside Slider",
    "SliderTrack": "use Slider.Track inside Slider",

    // ─── SWITCH ────────────────────────────────────────────────────────────────
    "SwitchContent": "use Switch.Content inside Switch",
    "SwitchControl": "use Switch.Control inside Switch",
    "SwitchIcon": "use Switch.Icon inside Switch",
    "SwitchThumb": "use Switch.Thumb inside Switch",

    // ─── TABLE ─────────────────────────────────────────────────────────────────
    "TableBody": "use Table.Body inside Table",
    "TableCell": "use Table.Cell inside Table",
    "TableCollection": "use Table.Collection inside Table",
    "TableColumn": "use Table.Column inside Table",
    "TableColumnResizer": "use Table.ColumnResizer inside Table",
    "TableContent": "use Table.Content inside Table",
    "TableFooter": "use Table.Footer inside Table",
    "TableHeader": "use Table.Header inside Table",
    "TableLoadMore": "use Table.LoadMore inside Table",
    "TableLoadMoreContent": "use Table.LoadMoreContent inside Table",
    "TableResizableContainer": "use Table.ResizableContainer inside Table",
    "TableRow": "use Table.Row inside Table",
    "TableScrollContainer": "use Table.ScrollContainer inside Table",

    // ─── TABS ──────────────────────────────────────────────────────────────────
    "TabsIndicator": "use Tabs.Indicator inside Tabs",
    "TabsList": "use Tabs.List inside Tabs",
    "TabsListContainer": "use Tabs.ListContainer inside Tabs",
    "TabsPanel": "use Tabs.Panel inside Tabs",
    "TabsSeparator": "use Tabs.Separator inside Tabs",
    "TabsTab": "use Tabs.Tab inside Tabs",

    // ─── TAG GROUP ─────────────────────────────────────────────────────────────
    "TagRemoveButton": "use Tag.RemoveButton inside Tag",
    "TagGroupList": "use TagGroup.List inside TagGroup",

    // ─── TIME FIELD ────────────────────────────────────────────────────────────
    "TimeFieldGroup": "use TimeField.Group inside TimeField",
    "TimeFieldInput": "use TimeField.Input inside TimeField",
    "TimeFieldPrefix": "use TimeField.Prefix inside TimeField",
    "TimeFieldSegment": "use TimeField.Segment inside TimeField",
    "TimeFieldSuffix": "use TimeField.Suffix inside TimeField",

    // ─── TOAST ─────────────────────────────────────────────────────────────────
    "ToastActionButton": "use Toast.ActionButton inside Toast",
    "ToastCloseButton": "use Toast.CloseButton inside Toast",
    "ToastContent": "use Toast.Content inside Toast",
    "ToastDescription": "use Toast.Description inside Toast",
    "ToastIndicator": "use Toast.Indicator inside Toast",
    "ToastProvider": "use Toast.Provider inside Toast",
    "ToastTitle": "use Toast.Title inside Toast",

    // ─── TOOLTIP ───────────────────────────────────────────────────────────────
    "TooltipArrow": "use Tooltip.Arrow inside Tooltip",
    "TooltipContent": "use Tooltip.Content inside Tooltip",
    "TooltipTrigger": "use Tooltip.Trigger inside Tooltip",
};

export const KNOWN_V2_PROPS: Array<{
    prop: string;
    replacement?: string;
    removed?: boolean;
    components?: string[];
    note: string;
}> = [
        {
            prop: "color",
            replacement: "variant",
            components: ["Button", "ButtonGroup"],
            note: "Button.color='primary|secondary|success|warning|danger|default' → Button.variant='primary|secondary|tertiary|ghost|danger'. Button no longer has a color prop; intent is expressed via variant.",
        },
        {
            prop: "motionProps",
            removed: true,
            note: "motionProps was used to customize framer-motion animations (e.g., initial, animate, exit on Accordion, Modal, etc.). In v3, animations are CSS-based. Use CSS transitions/keyframes instead.",
        },
        {
            prop: "disableAnimation",
            removed: true,
            note: "disableAnimation is no longer a prop in v3. Animation control is done at the theme/CSS level via HeroUIProvider's disableAnimation prop or CSS prefers-reduced-motion.",
        },
        {
            prop: "classNames",
            removed: true,
            note: "classNames (object with slot keys) is replaced by className string + BEM CSS classes. In v3, style slots via CSS selectors like .card__header, .button__icon, etc.",
        },
        {
            prop: "isBlurred",
            removed: true,
            components: ["Card"],
            note: "Card.isBlurred removed in v3. Apply backdrop-blur via className instead.",
        },
        {
            prop: "isFooterBlurred",
            removed: true,
            components: ["Card"],
            note: "Card.isFooterBlurred removed in v3. Use className on Card.Footer instead.",
        },
        {
            prop: "isHoverable",
            removed: true,
            components: ["Card"],
            note: "Card.isHoverable removed in v3. Use className hover: utilities instead.",
        },
        {
            prop: "isPressable",
            removed: true,
            components: ["Card"],
            note: "Card.isPressable removed. Wrap Card content in a Button or add onPress to Card directly in v3.",
        },
        {
            prop: "spinnerVariant",
            removed: true,
            components: ["HeroUIProvider"],
            note: "HeroUIProvider.spinnerVariant removed in v3. Configure spinner appearance via CSS.",
        },
        {
            prop: "defaultDates",
            removed: true,
            components: ["HeroUIProvider"],
            note: "HeroUIProvider.defaultDates removed.",
        },
        {
            prop: "variant",
            replacement: "variant",
            components: ["Chip"],
            note: "Chip.variant values changed: 'flat'→'soft', 'bordered'→'secondary', 'light'→'tertiary', 'shadow'→removed. 'solid|faded|dot' may also be renamed.",
        },
        {
            prop: "variant",
            replacement: "variant",
            components: ["Tabs"],
            note: "Tabs.variant values changed: in v3, values are 'primary|secondary|tertiary'. Old values like 'underlined|bordered|light|solid' are renamed.",
        },
        {
            prop: "isClearable",
            removed: true,
            components: ["Input"],
            note: "Input.isClearable removed. Use SearchField with a clear button, or add a manual clear button via InputGroup.",
        },
        {
            prop: "variant",
            replacement: "variant",
            components: ["Input", "Textarea"],
            note: "Input/Textarea.variant values changed: v3 uses 'primary|secondary'. Old values 'flat|bordered|faded|underlined' are gone.",
        },
        {
            prop: "isBlurred",
            removed: true,
            components: ["Navbar"],
            note: "Navbar does not exist in v3. All Navbar-related props are invalid.",
        },
        {
            prop: "renderValue",
            removed: false,
            components: ["Select"],
            note: "Select.renderValue may not work the same in v3. Review Select.Value compound component pattern instead.",
        },
        {
            prop: "backdrop",
            removed: false,
            components: ["Modal"],
            note: "Modal.backdrop prop may have changed values. In v3, backdrop customization is done via Modal.Backdrop compound component.",
        },
        {
            prop: "placement",
            removed: false,
            components: ["Modal"],
            note: "Modal.placement is still supported but check value names have not changed.",
        },
    ];


