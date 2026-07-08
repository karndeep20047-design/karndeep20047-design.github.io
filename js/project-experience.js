/**
 * Bencodes-style project interactions:
 * - Spring cursor + vertical image strip on hover
 * - Full-page curtain reveal + project detail on click
 */
(function () {
    const PREVIEW_W = 385;
    const PREVIEW_H = 200;
    const SPRING_STIFFNESS = 200;
    const SPRING_DAMPING = 50;
    const PROJECT_ORDER = ['afrispace', 'nexpesa', 'uniscope'];

    const PROJECTS = {
        afrispace: {
            title: 'Afri Space',
            category: 'Full-Stack \u00b7 GIS \u00b7 Fintech',
            year: '2024\u201325',
            github: '#',
            live: '#',
            color: '196, 98, 45',
            image: 'Images/Afrispace/landing%20page.png',
            imageDetail: 'Images/Afrispace/landing%20page.png',
            description: 'A Kenya-focused billboard marketplace with three role-based portals (advertiser, owner, admin). Advertisers discover inventory on Leaflet maps with satellite and traffic overlays, book campaigns, and pay via Safaricom M-Pesa STK Push. Owners list billboards, approve bookings, and track payouts. Admins moderate users, listings, bookings, and platform maintenance.',
            technologies: {
                frontend: 'JavaScript, Leaflet.js, HTML/CSS',
                backend: 'PHP, MySQL, M-Pesa Daraja, PHPMailer'
            },
            tags: ['PHP', 'MySQL', 'Leaflet.js', 'M-Pesa', 'GIS'],
            galleryFolder: 'Images/Afrispace',
            gallery: [
                ['landing page.png', 'Public landing page'],
                ['Signup page.png', 'Role-based sign-up'],
                ['advertisers how it works.png', 'How it works for advertisers'],
                ['map for advertiser.png', 'Interactive map discovery'],
                ['satellite map for advertiser.png', 'Satellite map layer'],
                ['live traffic feed on map.png', 'Live traffic overlay on map'],
                ['search and browse page.png', 'Search & filter billboards'],
                ['search filter city modal.png', 'County / city filters'],
                ['list view browse.png', 'List view browse'],
                ['billboard details page.png', 'Billboard detail page'],
                ['billboard details page with availability calendar.png', 'Availability calendar'],
                ['booking page.png', 'Multi-step booking flow'],
                ['mpesa payment page.png', 'M-Pesa payment checkout'],
                ['authenticating mpesa payment.png', 'STK Push authentication'],
                ['payment confirmed mpesa.png', 'Payment confirmed'],
                ['payment failled mpesa.png', 'Failed payment handling'],
                ['advertiser dashboard.png', 'Advertiser dashboard'],
                ['my bookings page.png', 'My bookings'],
                ['ad upload  page.png', 'Creative upload'],
                ['advertiser chat to owner.png', 'In-app messaging'],
                ['owner dashboard.png', 'Owner dashboard'],
                ['owner pin and search location on map.png', 'Pin billboard on map'],
                ['add billboard form.png', 'Add billboard listing'],
                ['notifications shown in owner.png', 'Owner notifications'],
                ['email notifications.png', 'PHPMailer notifications'],
                ['invoive generated.png', 'PDF invoice generation'],
                ['admin dashboard.png', 'Admin dashboard'],
                ['admin verifying users.png', 'Owner verification'],
                ['admin controlling all users.png', 'User management'],
                ['maintenance configuration page.png', 'Maintenance mode config'],
                ['maintenance ongoing shown.png', 'Maintenance mode live']
            ]
        },
        nexpesa: {
            title: 'NexPesa',
            category: 'React \u00b7 TypeScript \u00b7 Supabase',
            year: '2024\u201325',
            github: '#',
            live: '#',
            color: '99, 102, 241',
            image: 'Images/Nexpesa/landing%20page.png',
            imageDetail: 'Images/Nexpesa/landing%20page.png',
            description: 'Personal finance workspace for tracking income, spending, savings goals, and cash-flow insights. Built with React, TypeScript, and Supabase Auth with Row Level Security so each user\'s data stays isolated at the database layer.',
            technologies: {
                frontend: 'React, TypeScript, Recharts, Vite',
                backend: 'Supabase (PostgreSQL, Auth, RLS)'
            },
            tags: ['React', 'TypeScript', 'Supabase', 'Recharts'],
            galleryFolder: 'Images/Nexpesa',
            gallery: [
                ['landing page.png', 'Marketing landing page'],
                ['landing page, where it matters section.png', 'Product value proposition'],
                ['dashboard light mode.png', 'Finance dashboard — light theme'],
                ['dashboard dark mode.png', 'Finance dashboard — dark theme']
            ]
        },
        uniscope: {
            title: 'UniScope Magazine',
            category: 'PHP \u00b7 MySQL \u00b7 Enterprise Web',
            year: '2024\u201325',
            github: '#',
            live: 'https://uniscope.wuaze.com/Uni_Scope2/',
            color: '30, 58, 95',
            image: 'Images/UniScope/user%20llogin%20selection%20page.png',
            imageDetail: 'Images/UniScope/user%20llogin%20selection%20page.png',
            description: 'University magazine CMS with five roles, Agile delivery as Scrum Master, PHPMailer notifications, and post-closure ZIP export for publication.',
            technologies: {
                frontend: 'HTML, CSS, JavaScript',
                backend: 'PHP, MySQL, PHPMailer, PclZip'
            },
            tags: ['PHP', 'MySQL', 'Agile/Scrum', 'RBAC'],
            galleryFolder: 'Images/UniScope',
            gallery: [
                ['user llogin selection page.png', 'Role login & portal selection']
            ]
        }
    };

    class Spring1D {
        constructor(value, stiffness, damping) {
            this.value = value;
            this.target = value;
            this.velocity = 0;
            this.stiffness = stiffness;
            this.damping = damping;
        }
        set(v) { this.target = v; }
        update(dt) {
            const force = -this.stiffness * (this.value - this.target);
            const damp = -this.damping * this.velocity;
            this.velocity += (force + damp) * dt;
            this.value += this.velocity * dt;
        }
    }

    function initProjectExperience() {
        const workPreview = document.getElementById('work-preview');
        const previewStrip = document.getElementById('work-preview-strip');
        const workSection = document.getElementById('work');
        const workList = document.getElementById('work-list');
        const workRows = document.querySelectorAll('.work-row');
        const projectOverlay = document.getElementById('project-overlay');
        const projectCurtain = document.getElementById('project-curtain');
        const projectPage = document.getElementById('project-page');
        const projectPageScroll = document.getElementById('project-page-scroll');
        const projectPageClose = document.getElementById('project-page-close');

        if (!workList || !workRows.length) return;

        const canHoverPreview = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

        if (previewStrip) {
            previewStrip.innerHTML = PROJECT_ORDER.map((id) => {
                const p = PROJECTS[id];
                return `<img src="${p.image}" alt="${p.title}" width="${PREVIEW_W}" height="${PREVIEW_H}" loading="eager">`;
            }).join('');
            previewStrip.style.height = `${PREVIEW_H * PROJECT_ORDER.length}px`;
        }

        PROJECT_ORDER.forEach((id) => {
            new Image().src = PROJECTS[id].image;
            new Image().src = PROJECTS[id].imageDetail;
        });

        const springX = new Spring1D(0, SPRING_STIFFNESS, SPRING_DAMPING);
        const springY = new Spring1D(0, SPRING_STIFFNESS, SPRING_DAMPING);
        let hoveredIndex = -1;
        let stripOffset = 0;
        let stripTarget = 0;
        let previewRaf = null;
        let overlayOpen = false;
        let closeTimer = null;

        function projectIndexFromRow(row) {
            return PROJECT_ORDER.indexOf(row.getAttribute('data-project'));
        }

        function updatePreviewPosition() {
            if (!workPreview) return;
            workPreview.style.transform = `translate3d(${springX.value}px, ${springY.value}px, 0) translate(-50%, -50%)`;
        }

        function tickSprings() {
            springX.update(1 / 60);
            springY.update(1 / 60);
            stripOffset += (stripTarget - stripOffset) * 0.22;
            if (previewStrip) {
                previewStrip.style.transform = `translate3d(0, ${stripOffset}px, 0)`;
            }
            updatePreviewPosition();
            previewRaf = requestAnimationFrame(tickSprings);
        }

        function startSprings() {
            if (!previewRaf) previewRaf = requestAnimationFrame(tickSprings);
        }

        function setHovered(index) {
            if (overlayOpen) return;
            hoveredIndex = index;
            workRows.forEach((r, i) => r.classList.toggle('is-hovered', i === index));
            if (index >= 0) {
                stripTarget = -index * PREVIEW_H;
                workPreview.classList.add('is-visible');
                workPreview.setAttribute('aria-hidden', 'false');
            } else {
                workPreview.classList.remove('is-visible');
                workPreview.setAttribute('aria-hidden', 'true');
            }
        }

        function setOverlayCursor(hidden) {
            document.documentElement.classList.toggle('project-open', hidden);
            document.body.classList.toggle('project-open', hidden);
            ['cursor-dot', 'cursor-ring', 'cursor-glass'].forEach((id) => {
                const el = document.getElementById(id);
                if (el) el.style.visibility = hidden ? 'hidden' : '';
            });
        }

        let galleryState = null;
        let lightboxOpen = false;
        let lightboxInited = false;

        const lightbox = document.getElementById('project-lightbox');
        const lightboxBackdrop = document.getElementById('project-lightbox-backdrop');
        const lightboxClose = document.getElementById('project-lightbox-close');
        const lightboxImg = document.getElementById('project-lightbox-img');
        const lightboxCaption = document.getElementById('project-lightbox-caption');
        const lightboxPanel = lightbox?.querySelector('.project-lightbox-panel');

        function openLightbox(src, alt, caption) {
            if (!lightbox || !lightboxImg) return;
            galleryState?.stop();
            lightboxImg.src = src;
            lightboxImg.alt = alt || '';
            if (lightboxCaption) lightboxCaption.textContent = caption || '';
            lightbox.classList.add('is-open');
            lightbox.setAttribute('aria-hidden', 'false');
            lightboxOpen = true;
        }

        function closeLightbox() {
            if (!lightbox || !lightboxOpen) return;
            lightbox.classList.remove('is-open');
            lightbox.setAttribute('aria-hidden', 'true');
            lightboxOpen = false;
            lightboxImg.removeAttribute('src');
            if (overlayOpen && galleryState) {
                galleryState.resetAutoplay?.();
            }
        }

        function initProjectLightbox() {
            if (lightboxInited || !lightbox || !projectPageScroll) return;
            lightboxInited = true;

            lightboxBackdrop?.addEventListener('click', closeLightbox);
            lightboxClose?.addEventListener('click', closeLightbox);
            lightboxPanel?.addEventListener('click', (e) => e.stopPropagation());

            projectPageScroll.addEventListener('click', (e) => {
                const img = e.target.closest('.project-gallery-slide img, .project-page-hero.is-zoomable');
                if (!img) return;
                e.preventDefault();
                e.stopPropagation();
                let caption = img.alt || '';
                const gallery = img.closest('.project-gallery');
                if (gallery) {
                    const capEl = document.getElementById('project-gallery-caption');
                    if (capEl) caption = capEl.textContent;
                }
                openLightbox(img.currentSrc || img.src, img.alt, caption);
            });

            projectPageScroll.addEventListener('keydown', (e) => {
                const img = e.target.closest('.project-gallery-slide img, .project-page-hero.is-zoomable');
                if (!img) return;
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    img.click();
                }
            });
        }

        function galleryImageSrc(folder, filename) {
            return `${folder}/${encodeURIComponent(filename)}`;
        }

        function renderGalleryHtml(project) {
            const folder = project.galleryFolder || 'Images/Afrispace';
            const slides = project.gallery.map(([file, caption], i) => `
                <figure class="project-gallery-slide">
                    <img class="is-zoomable" src="${galleryImageSrc(folder, file)}" alt="${caption}" loading="${i < 2 ? 'eager' : 'lazy'}" tabindex="0" role="button" title="View full size">
                </figure>
            `).join('');
            const total = String(project.gallery.length).padStart(2, '0');
            return `
                <div class="project-gallery" id="project-gallery">
                    <div class="project-gallery-frame" style="border-color: rgb(${project.color}); box-shadow: 0 0 16px 8px rgba(${project.color}, 0.22);">
                        <div class="project-gallery-viewport">
                            <div class="project-gallery-track" id="project-gallery-track">${slides}</div>
                        </div>
                        <button type="button" class="project-gallery-btn project-gallery-prev" id="project-gallery-prev" aria-label="Previous slide">&larr;</button>
                        <button type="button" class="project-gallery-btn project-gallery-next" id="project-gallery-next" aria-label="Next slide">&rarr;</button>
                    </div>
                    <div class="project-gallery-footer">
                        <p class="project-gallery-caption" id="project-gallery-caption">${project.gallery[0][1]}</p>
                        <span class="project-gallery-counter" id="project-gallery-counter">01 / ${total}</span>
                    </div>
                </div>
            `;
        }

        function renderMediaHtml(project) {
            if (project.gallery && project.gallery.length) {
                return renderGalleryHtml(project);
            }
            return `<img class="project-page-hero is-zoomable" src="${project.imageDetail}" alt="${project.title}" tabindex="0" role="button" title="View full size"
                style="border-color: rgb(${project.color}); box-shadow: 0 0 16px 8px rgba(${project.color}, 0.22);">`;
        }

        function initProjectGallery(project) {
            if (!project.gallery || !project.gallery.length) return;
            const track = document.getElementById('project-gallery-track');
            const captionEl = document.getElementById('project-gallery-caption');
            const counterEl = document.getElementById('project-gallery-counter');
            const prevBtn = document.getElementById('project-gallery-prev');
            const nextBtn = document.getElementById('project-gallery-next');
            if (!track || !captionEl || !counterEl) return;

            const total = project.gallery.length;
            let index = 0;
            let autoplayTimer = null;

            function formatCounter(i) {
                return `${String(i + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
            }

            function goTo(nextIndex) {
                index = (nextIndex + total) % total;
                track.style.transform = `translate3d(-${index * 100}%, 0, 0)`;
                captionEl.textContent = project.gallery[index][1];
                counterEl.textContent = formatCounter(index);
            }

            function next() {
                goTo(index + 1);
                resetAutoplay();
            }

            function prev() {
                goTo(index - 1);
                resetAutoplay();
            }

            function resetAutoplay() {
                clearInterval(autoplayTimer);
                autoplayTimer = setInterval(() => goTo(index + 1), 5500);
            }

            function stop() {
                clearInterval(autoplayTimer);
            }

            function resetAutoplayPublic() {
                resetAutoplay();
            }

            prevBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                prev();
            });
            nextBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                next();
            });
            galleryState = { next, prev, stop, resetAutoplay: resetAutoplayPublic };
            goTo(0);
            resetAutoplay();
        }

        function renderProjectPage(project) {
            const tech = project.technologies;
            const liveDisabled = !project.live || project.live === '#';
            const ghDisabled = !project.github || project.github === '#';
            const mediaHtml = renderMediaHtml(project);
            projectPageScroll.innerHTML = `
                <article class="project-page-inner">
                    <header class="project-page-header">
                        <p class="project-page-meta">${project.category} &middot; ${project.year}</p>
                        <h1 class="project-page-title" id="project-page-title">${project.title}</h1>
                    </header>
                    <p class="project-page-desc">${project.description}</p>
                    <div class="project-page-tech">
                        <p><span>Frontend</span> ${tech.frontend}</p>
                        <p><span>Backend</span> ${tech.backend}</p>
                    </div>
                    <div class="project-page-tags">
                        ${project.tags.map((t) => `<span>${t}</span>`).join('')}
                    </div>
                    ${mediaHtml}
                    <div class="project-page-actions">
                        <a href="${liveDisabled ? '#' : project.live}" class="btn-solid${liveDisabled ? ' is-disabled' : ''}"
                            ${liveDisabled ? '' : 'target="_blank" rel="noopener"'}>Live Demo <span class="arrow">&rarr;</span></a>
                        <a href="${ghDisabled ? '#' : project.github}" class="btn-ghost${ghDisabled ? ' is-disabled' : ''}"
                            ${ghDisabled ? '' : 'target="_blank" rel="noopener"'}>GitHub <span class="arrow">&rarr;</span></a>
                    </div>
                </article>
            `;
        }

        function openProject(projectId) {
            const project = PROJECTS[projectId];
            if (!project || !projectOverlay) return;

            setHovered(-1);
            if (workPreview) {
                workPreview.classList.remove('is-visible');
                workPreview.setAttribute('aria-hidden', 'true');
            }
            overlayOpen = true;
            renderProjectPage(project);
            initProjectGallery(project);

            projectOverlay.classList.add('is-open');
            projectOverlay.setAttribute('aria-hidden', 'false');
            setOverlayCursor(true);
            document.documentElement.style.overflowY = 'hidden';

            projectCurtain.classList.add('is-active');
            requestAnimationFrame(() => projectCurtain.classList.add('is-revealed'));

            setTimeout(() => {
                projectPage.classList.add('is-visible');
                projectOverlay.classList.add('is-page-ready');
            }, 800);
        }

        function closeProject() {
            if (!overlayOpen) return;
            closeLightbox();
            galleryState?.stop();
            galleryState = null;
            projectPage.classList.remove('is-visible');
            projectOverlay.classList.remove('is-page-ready');
            projectCurtain.classList.remove('is-revealed');

            clearTimeout(closeTimer);
            closeTimer = setTimeout(() => {
                projectCurtain.classList.remove('is-active');
                projectOverlay.classList.remove('is-open');
                projectOverlay.setAttribute('aria-hidden', 'true');
                overlayOpen = false;
                document.documentElement.style.overflowY = '';
                setOverlayCursor(false);
                projectPageScroll.innerHTML = '';
            }, 800);
        }

        workRows.forEach((row) => {
            row.classList.add('project-item');
            row.addEventListener('click', () => {
                const id = row.getAttribute('data-project');
                if (id) openProject(id);
            });
            row.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const id = row.getAttribute('data-project');
                    if (id) openProject(id);
                }
            });

            if (canHoverPreview) {
                row.addEventListener('mouseenter', (e) => {
                    const idx = projectIndexFromRow(row);
                    if (idx < 0) return;
                    springX.set(e.clientX);
                    springY.set(e.clientY);
                    if (hoveredIndex === -1) {
                        springX.value = e.clientX;
                        springY.value = e.clientY;
                        updatePreviewPosition();
                    }
                    setHovered(idx);
                });
                row.addEventListener('mouseleave', () => row.classList.remove('is-hovered'));
            } else {
                row.addEventListener('mouseenter', () => row.classList.add('is-hovered'));
                row.addEventListener('mouseleave', () => row.classList.remove('is-hovered'));
            }
        });

        if (canHoverPreview && workPreview) {
            function syncHoverFromPointer() {
                if (overlayOpen) return;

                if (workSection) {
                    const rect = workSection.getBoundingClientRect();
                    const inWorkSection =
                        springY.value >= rect.top &&
                        springY.value <= rect.bottom &&
                        springX.value >= rect.left &&
                        springX.value <= rect.right;
                    if (!inWorkSection) {
                        if (hoveredIndex >= 0) setHovered(-1);
                        return;
                    }
                }

                const el = document.elementFromPoint(springX.value, springY.value);
                if (el && workPreview.contains(el)) {
                    if (hoveredIndex >= 0) setHovered(-1);
                    return;
                }

                const item = el && el.closest('.project-item');
                if (item && workList.contains(item)) {
                    const idx = Array.from(workRows).indexOf(item);
                    if (idx >= 0) {
                        if (idx !== hoveredIndex) setHovered(idx);
                        return;
                    }
                }

                if (hoveredIndex >= 0) setHovered(-1);
            }

            const onMouseMove = (e) => {
                springX.set(e.clientX);
                springY.set(e.clientY);
                startSprings();
                syncHoverFromPointer();
            };
            window.addEventListener('mousemove', onMouseMove);
            workList.addEventListener('mouseleave', () => setHovered(-1));

            window.addEventListener('scroll', () => {
                if (!overlayOpen) syncHoverFromPointer();
            }, { passive: true });

            if (workSection && 'IntersectionObserver' in window) {
                const workObserver = new IntersectionObserver((entries) => {
                    if (overlayOpen) return;
                    if (!entries[0].isIntersecting && hoveredIndex >= 0) setHovered(-1);
                }, { threshold: 0 });
                workObserver.observe(workSection);
            }

            startSprings();
        }

        if (projectPageClose) projectPageClose.addEventListener('click', closeProject);
        initProjectLightbox();

        document.addEventListener('keydown', (e) => {
            if (lightboxOpen && e.key === 'Escape') {
                e.preventDefault();
                closeLightbox();
                return;
            }
            if (!overlayOpen) return;
            if (e.key === 'Escape') closeProject();
            if (galleryState && e.key === 'ArrowRight') {
                e.preventDefault();
                galleryState.next();
            }
            if (galleryState && e.key === 'ArrowLeft') {
                e.preventDefault();
                galleryState.prev();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProjectExperience);
    } else {
        initProjectExperience();
    }
})();
